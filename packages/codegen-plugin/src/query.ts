import {
  GraphQLFieldMap,
  OperationDefinitionNode,
  isListType,
  isNonNullType,
} from 'graphql';
import { toPascalCase, unindent } from './utils';

// For tree-shaking purposes, use named imports for non-type imports
export const queryDependecies = [
  "import { computed as vueComputed } from 'vue';",
  "import { useQuery as vueApolloUseQuery, useLazyQuery as vueApolloUseLazyQuery } from '@vue/apollo-composable';",

  // @vue/apollo-composable doesn't directly export the types we need, so we import them from its specific file
  "import type * as VueApolloQuery from '@vue/apollo-composable/dist/useQuery';",

  "import type { UseQueryReturn as VueApolloUseQueryReturn } from '@vue/apollo-composable';",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createQueryProcessor(queryFields: GraphQLFieldMap<any, any>) {
  return function processQuery({
    name: nameNode,
    variableDefinitions,
    selectionSet,
  }: OperationDefinitionNode) {
    if (!nameNode) {
      console.warn('[vue-apollo] Skipping unnamed query');
      return;
    }
    // Queries should contain their first selection as the field name on the GraphQL schema
    const field = selectionSet.selections[0];
    if (field?.kind !== 'Field') {
      console.warn('[vue-apollo] Skipping query with no field');
      return;
    }
    const fieldName = field.name.value;
    const rawName = nameNode.value;
    const name = toPascalCase(rawName);
    const queryName = `${name}Query`;
    const lazyQueryName = `${name}LazyQuery`;
    const documentName = `${name}Document`;

    const mainType = queryFields[fieldName]?.type;
    const isNonNullableArray =
      isNonNullType(mainType) && isListType(mainType.ofType);

    const hasVariables = variableDefinitions && variableDefinitions.length > 0;
    const variablesModifier = hasVariables ? '' : ' = {}';

    return unindent(`
    export function use${queryName}(
      variables: VueApolloQuery.VariablesParameter<${queryName}Variables>${variablesModifier},
      options: VueApolloQuery.OptionsParameter<${queryName}, ${queryName}Variables> = {},
    ) {
      const useQuery = vueApolloUseQuery(${documentName}, variables, options);
      return {
        ...useQuery,
        ${fieldName}: vueComputed(() => useQuery.result.value?.${fieldName}${
      isNonNullableArray ? ' ?? []' : ''
    }),
      };
    }

    export function use${lazyQueryName}(
      variables: VueApolloQuery.VariablesParameter<${queryName}Variables>${variablesModifier},
      options: VueApolloQuery.OptionsParameter<${queryName}, ${queryName}Variables> = {},
    ) {
      return vueApolloUseLazyQuery(${documentName}, variables, options);
    }

    export type ${name}CompositionFunctionResult = VueApolloUseQueryReturn<${queryName}, ${queryName}Variables>;
    `);
  };
}

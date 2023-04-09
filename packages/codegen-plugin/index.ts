import { type CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import {
  GraphQLFieldMap,
  isListType,
  isNonNullType,
  type OperationDefinitionNode,
} from 'graphql';

const toPascalCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Unindents a string by a given number of spaces (default 8)
 * and removes the first and last line (which are empty)
 */
const unindent = (str: string, level = 4) =>
  str
    .split('\n')
    .slice(1, -1)
    .map((line) => line.slice(level))
    .join('\n');

const codegenPlugin: CodegenPlugin = {
  // Since this plugin is designed to work only with near-operation-file, there will always only be 1 document file at a time
  plugin(schema, [documentFile]) {
    if (!documentFile) {
      return '';
    }
    const { document } = documentFile;
    if (!document) {
      return '';
    }

    const queryType = schema.getQueryType();
    if (!queryType) {
      return '';
    }

    const operations = document.definitions.filter(
      (definition): definition is OperationDefinitionNode =>
        definition.kind === 'OperationDefinition',
    );

    const queryFields = queryType.getFields();
    const queryContents = operations
      .filter(({ operation }) => operation === 'query')
      .map(createQueryProcessor(queryFields))
      .filter((content): content is string => content !== undefined);

    const mutationContents = operations
      .filter(({ operation }) => operation === 'mutation')
      .map(createMutationProcessor())
      .filter((content): content is string => content !== undefined);

    const haveQueries = queryContents.length > 0;
    const haveMutations = mutationContents.length > 0;

    return {
      prepend: [
        ...(haveQueries || haveMutations
          ? ["import type * as VueApollo from '@vue/apollo-composable';"]
          : []),

        ...(haveQueries
          ? [
              // @vue/apollo-composable doesn't directly export the types we need, so we import them from its specific file
              "import type * as VueApolloQuery from '@vue/apollo-composable/dist/useQuery';",
              "import { computed as vueComputed } from 'vue';",
              "import { useQuery as vueApolloUseQuery, useLazyQuery as vueApolloUseLazyQuery } from '@vue/apollo-composable';",
            ]
          : []),

        ...(haveMutations
          ? [
              "import { useMutation as vueApolloUseMutation, useApolloClient as vueApolloUseApolloClient } from '@vue/apollo-composable';",
              "import { ApolloError as ApolloCoreApolloError } from '@apollo/client/core';",

              "import type { Ref as VueRef } from 'vue';",
              // @vue/apollo-composable doesn't export the OptionsParameter even from the specific file, so we mimic it here
              "import type { ReactiveFunction as VueApolloReactiveFunction } from '@vue/apollo-composable/dist/util/ReactiveFunction';",
              unindent(
                `
                type VueApolloMutationOptionsParameter<TResult, TVariables> = |
                  VueApollo.UseMutationOptions<TResult, TVariables> |
                  VueRef<VueApollo.UseMutationOptions<TResult, TVariables>> |
                  VueApolloReactiveFunction<VueApollo.UseMutationOptions<TResult, TVariables>>;
              `,
                16,
              ),
            ]
          : []),
      ],
      content: queryContents.join('\n') + mutationContents.join('\n'),
    };
  },
};

/**
 * Needs the following type imports/aliases:
 * - import type * as Vue from 'vue';
 * - import type * as VueApollo from '@vue/apollo-composable';
 * - import type * as VueApolloQuery from '@vue/apollo-composable/dist/useQuery';
 *
 * (For tree-shaking purposes, we use specific imports for non-type imports)
 * Needs the following imports:
 * - import { computed as vueComputed } from 'vue';
 * - import { useQuery as vueApolloUseQuery, useLazyQuery as vueApolloUseLazyQuery } from '@vue/apollo-composable';
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createQueryProcessor(queryFields: GraphQLFieldMap<any, any>) {
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

    export type ${name}CompositionFunctionResult = VueApollo.UseQueryReturn<${queryName}, ${queryName}Variables>;
    `);
  };
}

/**
 * Needs the following type imports/aliases:
 * - type VueApolloMutationOptionsParameter
 *
 * (For tree-shaking purposes, we use specific imports for non-type imports)
 * Needs the following imports:
 * - import { useMutation as vueApolloUseMutation, useApolloClient as vueApolloUseApolloClient } from '@vue/apollo-composable';
 * - import { ApolloError as ApolloCoreApolloError } from '@apollo/client/core';
 */
function createMutationProcessor() {
  return function processMutation({
    name: nameNode,
    selectionSet,
  }: OperationDefinitionNode) {
    if (!nameNode) {
      console.warn('[vue-apollo] Skipping unnamed mutation');
      return;
    }

    // Mutations should contain their first selection as the field/mutation name on the GraphQL schema
    const field = selectionSet.selections[0];
    if (field?.kind !== 'Field') {
      console.warn('[vue-apollo] Skipping mutation with no field');
      return;
    }

    const fieldName = field.name.value;
    const rawName = nameNode.value;
    const name = toPascalCase(rawName);
    const mutationName = `${name}Mutation`;
    const documentName = `${name}Document`;

    return unindent(`
    export function use${mutationName}(
      options?: VueApolloMutationOptionsParameter<${mutationName}, ${mutationName}Variables>,
    ) {
      const { resolveClient } = vueApolloUseApolloClient();
      const useMutation = vueApolloUseMutation(${documentName}, options);
      return {
        ...useMutation,
        ${fieldName}: async (...params: Parameters<typeof useMutation.mutate>) => {
          const result = await useMutation.mutate(...params);
          if (result?.errors && result.errors.length > 0) {
            throw new ApolloCoreApolloError({
              graphQLErrors: result.errors,
            });
          }
          const data = result?.data?.${fieldName};
          if (data === undefined) {${
            /* This case will probably never happen, but we cover it just in case (unless using a custom void scalar?) */ ''
          }
            throw new Error('No data returned from mutation')
          }

          const { cache } = resolveClient(${
            /* TODO: Use options.clientId here to support multiple clients */ ''
          });

          return { data, cache };
        },
      };
    }
    `);
  };
}

export default codegenPlugin;

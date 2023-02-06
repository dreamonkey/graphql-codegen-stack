import { type CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import {
  isListType,
  isNonNullType,
  type OperationDefinitionNode,
} from 'graphql';

/**
 * @param str camelCase string
 */
const toPascalCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

const codegenPlugin: CodegenPlugin = {
  // Since this plugin is designed to work only with near-operation-file, there will always only be 1 document file at a time
  plugin(schema, [documentFile]) {
    const { document } = documentFile;
    if (!document) {
      return {
        content: '',
      };
    }

    const queryType = schema.getQueryType();
    if (!queryType) {
      return {
        content: '',
      };
    }
    const queryFields = queryType.getFields();

    const operations = document.definitions.filter(
      (definition): definition is OperationDefinitionNode =>
        definition.kind === 'OperationDefinition',
    );
    const queries = operations.filter(({ operation }) => operation === 'query');
    const mutations = operations.filter(
      ({ operation }) => operation === 'mutation',
    );

    const queryContents = queries.map(
      ({ name: nameNode, variableDefinitions, selectionSet }) => {
        if (!nameNode) {
          console.warn('[vue-apollo] Skipping unnamed query');
          return;
        }
        // Queries should contain their first selection as the field name on the GraphQL schema
        const field = selectionSet.selections[0];
        if (field.kind !== 'Field') {
          console.warn('[vue-apollo] Skipping query with no field');
          return;
        }
        const fieldName = field.name.value;
        const rawName = nameNode.value;
        const name = toPascalCase(rawName);
        const queryName = `${name}Query`;
        const lazyQueryName = `${name}LazyQuery`;
        const documentName = `${name}Document`;

        const mainType = queryFields[fieldName].type;
        const isNonNullableArray =
          isNonNullType(mainType) && isListType(mainType.ofType);

        const hasVariables =
          variableDefinitions && variableDefinitions.length > 0;
        const variablesModifier = hasVariables ? '' : ' = {}';

        return `
        export function use${queryName}(
          variables: VueApolloQuery.VariablesParameter<${queryName}Variables>${variablesModifier},
          options: VueApolloQuery.OptionsParameter<${queryName}, ${queryName}Variables> = {},
        ) {
          const useQuery = VueApollo.useQuery(${documentName}, variables, options);
          return {
            ...useQuery,
            ${fieldName}: Vue.computed(() => useQuery.result.value?.${fieldName}${
          isNonNullableArray ? ' ?? []' : ''
        }),
          };
        }

        export function use${lazyQueryName}(
          variables: VueApolloQuery.VariablesParameter<${queryName}Variables>${variablesModifier},
          options: VueApolloQuery.OptionsParameter<${queryName}, ${queryName}Variables> = {},
        ) {
          return VueApollo.useLazyQuery(${documentName}, variables, options);
        }

        export type ${name}CompositionFunctionResult = VueApollo.UseQueryReturn<${queryName}, ${queryName}Variables>;
      `;
      },
    );

    const mutationContents = mutations.map(
      ({ name: nameNode, selectionSet }) => {
        if (!nameNode) {
          console.warn('[vue-apollo] Skipping unnamed mutation');
          return;
        }
        // Mutations should contain their first selection as the field/mutation name on the GraphQL schema
        const field = selectionSet.selections[0];
        if (field.kind !== 'Field') {
          console.warn('[vue-apollo] Skipping mutation with no field');
          return;
        }
        const fieldName = field.name.value;
        const rawName = nameNode.value;
        const name = toPascalCase(rawName);
        const mutationName = `${name}Mutation`;
        const documentName = `${name}Document`;

        return `
        export function use${mutationName}(
          options?: VueApolloMutationOptionsParameter<${mutationName}, ${mutationName}Variables>,
        ) {
          const { resolveClient } = VueApollo.useApolloClient();
          const useMutation = VueApollo.useMutation(${documentName}, options);
          return {
            ...useMutation,
            ${fieldName}: async (...params: Parameters<typeof useMutation.mutate>) => {
              const result = await useMutation.mutate(...params);
              if (result?.errors && result.errors.length > 0) {
                throw new ApolloCore.ApolloError({
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
      `;
      },
    );

    return {
      prepend: [
        "import * as Vue from 'vue';",
        "import * as VueApollo from '@vue/apollo-composable';",
        "import * as ApolloCore from '@apollo/client/core';",

        // @vue/apollo-composable doesn't directly export the types we need, so we import them from its specific file
        "import * as VueApolloQuery from '@vue/apollo-composable/dist/useQuery';",

        // @vue/apollo-composable doesn't export the OptionsParameter even from the specific file, so we mimic it here
        "import { ReactiveFunction as VueApolloReactiveFunction } from '@vue/apollo-composable/dist/util/ReactiveFunction';",
        `type VueApolloMutationOptionsParameter<TResult, TVariables> = |
          VueApollo.UseMutationOptions<TResult, TVariables> |
          Vue.Ref<VueApollo.UseMutationOptions<TResult, TVariables>> |
          VueApolloReactiveFunction<VueApollo.UseMutationOptions<TResult, TVariables>>;
        `,
      ],
      content: queryContents.join('\n') + mutationContents.join('\n'),
    };
  },
};

export default codegenPlugin;

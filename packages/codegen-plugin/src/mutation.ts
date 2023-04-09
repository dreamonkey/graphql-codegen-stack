import { OperationDefinitionNode } from 'graphql';
import { toPascalCase, unindent } from './utils';

// For tree-shaking purposes, use named imports for non-type imports
export const mutationDependecies = [
  "import { useMutation as vueApolloUseMutation, useApolloClient as vueApolloUseApolloClient } from '@vue/apollo-composable';",
  "import { ApolloError as ApolloCoreApolloError } from '@apollo/client/core';",

  "import type { UseMutationOptions as VueApolloUseMutationOptions } from '@vue/apollo-composable';",
  "import type { Ref as VueRef } from 'vue';",
  // @vue/apollo-composable doesn't export the OptionsParameter even from the specific file, so we mimic it here
  "import type { ReactiveFunction as VueApolloReactiveFunction } from '@vue/apollo-composable/dist/util/ReactiveFunction';",
  unindent(
    `
      type VueApolloMutationOptionsParameter<TResult, TVariables> = |
        VueApolloUseMutationOptions<TResult, TVariables> |
        VueRef<VueApolloUseMutationOptions<TResult, TVariables>> |
        VueApolloReactiveFunction<VueApolloUseMutationOptions<TResult, TVariables>>;
    `,
    6,
  ),
];

/**
 * Needs the following type imports/aliases:
 * - type VueApolloMutationOptionsParameter
 *
 * (For tree-shaking purposes, we use specific imports for non-type imports)
 * Needs the following imports:
 * - import { useMutation as vueApolloUseMutation, useApolloClient as vueApolloUseApolloClient } from '@vue/apollo-composable';
 * - import { ApolloError as ApolloCoreApolloError } from '@apollo/client/core';
 */
export function createMutationProcessor() {
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

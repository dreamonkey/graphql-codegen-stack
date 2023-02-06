import { type Plugin } from 'vite';

export default function graphQLCodegen(): Plugin {
  return {
    name: 'graphql-codegen',

    // TODO: Invoke GraphQL Codegen on the fly
    load(id) {
      if (id.endsWith('.graphql')) {
        return `export * from '${id}.ts'`;
      }
    },
  };
}

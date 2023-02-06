/**
 * @returns {import('vite').Plugin}
 */
module.exports = function graphQLCodegen() {
  return {
    name: 'graphql-codegen',

    // TODO: Invoke GraphQL Codegen on the fly
    load(id) {
      if (id.endsWith('.graphql')) {
        return `export * from '${id}.ts'`;
      }
    },
  };
};

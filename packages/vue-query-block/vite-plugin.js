/**
 * @returns {import('vite').Plugin}
 */
module.exports = function vueQueryBlock() {
  return {
    name: 'graphql-codegen',

    // TODO: Invoke GraphQL Codegen on the fly
    transform(_code, id) {
      if (/vue&type=query/.test(id)) {
        // To avoid parsing errors, we must transform the custom <query> block.
        // The actual GraphQL stuff gets done by graphql-codegen.
        // So, just returning an empty function is enough.
        return `export default () => {}`;
      }
    },
  };
};

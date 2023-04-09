import { type Plugin } from 'vite';

export default function vueQueryBlock(): Plugin {
  return {
    name: 'graphql-codegen',

    // TODO: Invoke GraphQL Codegen on the fly
    transform(_code, id) {
      if (!/vue&type=query/.test(id)) {
        return;
      }

      // To avoid parsing errors, we must transform the custom <query> block.
      // The actual GraphQL stuff gets done by graphql-codegen.
      // So, just returning an empty function is enough.
      return {
        code: 'export default () => {}',
        // Empty sourcemap to avoid warnings
        map: { mappings: '' },
      };
    },
  };
}

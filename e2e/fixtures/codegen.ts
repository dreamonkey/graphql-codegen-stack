import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: [
    'src/**/*.graphql',
    {
      'src/components/PostCount.vue': {
        loader: '@dreamonkey/graphql-codegen-vue-query-block',
      },
    },
  ],
  generates: {
    'src/': {
      preset: 'near-operation-file',
      presetConfig: { extension: '.graphql.ts' },
      plugins: [
        'typescript-operations',
        'typed-document-node',
        '@dreamonkey/graphql-codegen-vue-apollo-plugin',
      ],
    },
  },
};

export default config;

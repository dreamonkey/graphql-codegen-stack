# @dreamonkey/graphql-codegen-vue-query-block

Write your GraphQL documents in Vue SFC `<query>` blocks to generate code with GraphQL Code Generator.

## Installation

Make sure you have installed and configured GraphQL Code Generator first:

- [GraphQL Code Generator | Installation](https://the-guild.dev/graphql/codegen/docs/getting-started/installation)

Install the package:

```shell
pnpm add -D @dreamonkey/graphql-codegen-vue-query-block
```

### GraphQL Code Generator config

Add the loader to your codegen config:

```ts
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // ...
  documents: [
    /* ... other kinds of documents, if any */ {
      'src/**/*.vue': { loader: '@dreamonkey/graphql-codegen-vue-query-block' },
    },
  ],
  // ...
};

export default config;
```

If you are using `near-operation-file` preset, do this instead:

```ts
// codegen.ts
import glob from 'fast-glob';
import type { CodegenConfig } from '@graphql-codegen/cli';

// A loader can't return multiple results, which completely messes up the near-operation-file preset with glob patterns
// So, we simply feed the paths one by one, instead of a glob pattern.
// https://github.com/dotansimha/graphql-code-generator/issues/6543
const vueFiles = glob.sync('src/**/*.vue');
const vueDocuments: CodegenConfig['documents'] = {};
for (const file of vueFiles) {
  vueDocuments[file] = {
    loader: '@dreamonkey/graphql-codegen-vue-query-block',
  };
}

const config: CodegenConfig = {
  // ...
  documents: [/* ... other kinds of documents, if any */ vueDocuments],
  // ...
};

export default config;
```

### Vite config

Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueQueryBlock from '@dreamonkey/graphql-codegen-vue-query-block/vite';

export default defineConfig({
  // ...
  plugins: [
    // ...
    vue(),
    // after the Vue plugin
    vueQueryBlock(),
  ],
  // ...
});
```

### Quasar Framework (@quasar/app-vite)

(_App Extension is coming soon_) <!-- TODO: Link the app extension when it's ready -->
If you are not using the App Extension, you can add the plugin to your `quasar.config.js`:

```js
// quasar.config.js
const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
  return {
    // ...
    build: {
      // ...
      vitePlugins: [
        // ...
        ['@dreamonkey/graphql-codegen-vue-query-block/vite'],
        // ...
      ],
    },
    // ...
  };
});
```

## Usage

Write your GraphQL documents(_queries, mutations, fragments_) in `<query>` blocks:

<!-- prettier-ignore -->
```html
<template>
  <!-- ... -->
</template>

<script lang="ts" setup>
// ...
</script>

<query lang="graphql">
fragment PostDetails on Post {
  id
  title
  body
}
</query>
```

Then, GraphQL Code Generator will generate the corresponding code according to your configuration.

## Examples

### `near-operation-file` preset

```ts
// codegen.ts
import glob from 'fast-glob';
import type { CodegenConfig } from '@graphql-codegen/cli';

const vueFiles = glob.sync('src/**/*.vue');
const vueDocuments: CodegenConfig['documents'] = {};
for (const file of vueFiles) {
  vueDocuments[file] = {
    loader: '@dreamonkey/graphql-codegen-vue-query-block',
  };
}

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA,
  documents: [vueDocuments],
  generates: {
    './src/generated/graphql.ts': {
      plugins: ['typescript'],
    },

    'src/': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.ts',
        baseTypesPath: 'generated/graphql.ts',
      },
      plugins: [
        'typescript-operations',
        'typed-document-node',
        '@dreamonkey/graphql-codegen-vue-apollo-plugin',
      ],
    },
  },
};

export default config;
```

<!-- prettier-ignore -->
```html
<!-- src/components/post.vue -->
<template>
  <q-spinner v-if="loading" />
  <q-btn v-else-if="!post" label="Not found! Click to retry" @click="refetch" />
  <q-item v-else clickable @click="logPost(post)">
    <q-item-section>
      <q-item-label>{{ post.title }}</q-item-label>
      <q-item-label caption>{{ post.body }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
// As we configured the extension to be .ts, the generated code will be in .ts files under the same name
// post.vue -> post.ts (can be imported as './post')
import { useGetPostQuery, PostDetailsFragment } from './post';

const { post, loading, refetch } = useGetPostQuery({ id: '1' });

// You can use the generated fragment type
function logPost(post: PostDetailsFragment) {
  console.log(post);
}
</script>

<query lang="graphql">
fragment PostDetails on Post {
  id
  title
  body
}

query getPost($id: ID!) {
  post(id: $id) {
    ...PostDetails
  }
}
</query>
```

## Donate

If you appreciate the work that went into this package, please consider [donating](https://github.com/sponsors/dreamonkey).

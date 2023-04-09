# @dreamonkey/graphql-codegen-near-operation-file

<!-- TODO: Create a new package for(or convert this package to) an opinionated, ready to use GraphQL Code Generator preset -->

Write your documents in `.graphql` files, then import the generated code from `.graphql` files in your code!

## Installation

Make sure you have installed and configured GraphQL Code Generator and the near-operation-file preset first:

- [GraphQL Code Generator | Installation](https://the-guild.dev/graphql/codegen/docs/getting-started/installation)
- [GraphQL Code Generator | Near Operation File Preset](https://the-guild.dev/graphql/codegen/docs/presets/near-operation-file)

Install the package:

```shell
pnpm add -D @dreamonkey/graphql-codegen-near-operation-file
```

### GraphQL Code Generator config

Configure the near-operation-file preset to use `.graphql.ts` extension:

```ts
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // ...
  generates: {
    // ...
    'src/': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.graphql.ts', // <--- This is the important part
        // ...
      },
      // ...
    },
  },
  // ...
};

export default config;
```

### Vite config

Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import graphqlNearOperationFile from '@dreamonkey/graphql-codegen-near-operation-file';

export default defineConfig({
  plugins: [
    // ...
    graphqlNearOperationFile(),
  ],
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
        ['@dreamonkey/graphql-codegen-near-operation-file'],
        // ...
      ],
    },
    // ...
  };
});
```

## Usage

Define your documents in `.graphql` files:

```graphql
# src/composables/posts.graphql
fragment PostDetails on Post {
  id
  title
  body
}

query getPosts {
  posts {
    ...PostDetails
  }
}
```

GraphQL Code Generator will generate the corresponding code as `.graphql.ts` files.

Then, you will be able to import the generated code from `.graphql` files in a natural fashion:

```ts
// src/composables/posts.ts
import {
  useGetPostsQuery,
  GetPostsDocument,
  PostDetailsFragment,
} from './posts.graphql';

// Use the generated code
```

## Donate

If you appreciate the work that went into this package, please consider [donating](https://github.com/sponsors/dreamonkey).

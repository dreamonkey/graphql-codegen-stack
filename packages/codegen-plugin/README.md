# @dreamonkey/graphql-codegen-vue-apollo-plugin

[GraphQL Code Generator](https://github.com/dotansimha/graphql-code-generator) plugin for [Vue Apollo](https://github.com/vuejs/apollo) on steroids 🚀

## Installation

Install the package:

```shell
pnpm add -D @dreamonkey/graphql-codegen-vue-apollo-plugin
```

Add the plugin to your codegen config:

```ts
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // ...
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        // ...

        // These plugins are required for the plugin to work
        'typed-document-node',
        'typescript-operations',

        // Add the plugin here
        '@dreamonkey/graphql-codegen-vue-apollo-plugin',
      ],
    },
  },
  // ...
};

export default config;
```

## Usage

Define the GraphQL document (_`gql` template string, `.graphql` file, etc._):

```graphql
fragment PostDetails on Post {
  id
  title
  body
}

query getPosts {
  # `posts` name will be used as the name of the data field in the composable result
  posts {
    ...PostDetails
  }
}

# `createPost` name will be used as the name of the mutation function in the composable result
mutation createPost($input: PostInput!) {
  posts {
    ...PostDetails
  }
}
```

Import and use the generated composables and types:

```ts
import {
  GetPostsDocument,
  useGetPostsQuery,
  useCreatePostMutation,
} from './path/to/generated/graphql';

// `posts` name is coming from the query's main field name, see above
// `result` contains the classic Apollo result, in case you still need it for some reason
// You don't have to extract the data you are looking for from the result
// You don't have to worry about null/undefined handling for non-nullable array fields,
// it will be an empty array when the data is being fetched
const { posts, loading } = useGetPostsQuery();
//      ^? ComputedRef<PostDetailsFragment[]>

// `createPost` name is coming from the mutation's name, see above
// `mutate` contains the classic Apollo mutation function, in case you still need it for some reason
const { createPost, loading: creatingPost } = useCreatePostMutation();
async function create() {
  // `data` contains the data you are interested in, and not the whole result

  // Error handling is done for you:
  // - You don't have to check for null/undefined even for non-nullable fields unlike before
  // - You don't have to check if the errors array exists, if it's non-empty, etc.
  // - It throws an error if the response contains any kind of errors, so you can simply use try/catch

  // The cache instance is directly available at your disposal

  const { data: newPost, cache } = await createPost({
    input: { title: 'Title', body: 'Body' },
  });

  cache.updateQuery(
    {
      query: GetPostsDocument,
    },
    (data) => {
      const posts = data?.posts;
      if (!posts) {
        return;
      }
      return {
        posts: [...posts, newPost],
      };
    },
  );
}
```

## Usage Comparison with `@graphql-codegen/typescript-vue-apollo`

### Queries

`@graphql-codegen/typescript-vue-apollo`:

```ts
import { computed } from 'vue';
import { useGetPostsQuery } from './path/to/generated/graphql';

const { result } = useGetPostsQuery();
//      ^? Ref<{ __typename?: 'Query'; posts: PostDetailsFragment[] } | undefined>
const posts = computed(() => result.value?.posts ?? []);
//      ^? ComputedRef<PostDetailsFragment[]>
```

`@dreamonkey/graphql-codegen-vue-apollo-plugin`:

```ts
import { useGetPostsQuery } from './path/to/generated/graphql';

const { posts } = useGetPostsQuery();
//      ^? ComputedRef<PostDetailsFragment[]>
```

### Mutations

`@graphql-codegen/typescript-vue-apollo`:

```ts
import { ApolloError } from '@apollo/client/errors';
import { useApolloClient } from '@vue/apollo-composable';
import { useCreatePostMutation } from './path/to/generated/graphql';

const { resolveClient } = useApolloClient();
const { mutate: createPost } = useCreatePostMutation({}); // {} is required even if you don't specify extra options
async function create() {
  try {
    const result = await createPost({
      input: { title: 'Title', body: 'Body' },
    });

    const newPost = result?.data?.createPost;
    if (!newPost || (result.errors && result.errors.length > 0)) {
      // Handle "GraphQL" error(s) through result.errors
      return;
    }

    const { cache } = resolveClient();
    cache.updateQuery(/* ... */);
  } catch (_error) {
    const error = _error as ApolloError;
    // Handle the rest of errors through error.networkError, error.clientErrors, etc.
    console.error(error);
  }
}
```

`@dreamonkey/graphql-codegen-vue-apollo-plugin`:

```ts
import { ApolloError } from '@apollo/client/errors';
import { useCreatePostMutation } from './path/to/generated/graphql';

const { createPost } = useCreatePostMutation();
async function create() {
  try {
    const { data: newPost, cache } = await createPost({
      input: { title: 'Title', body: 'Body' },
    });

    cache.updateQuery(/* ... */);
  } catch (_error) {
    const error = _error as ApolloError;
    // Handle all kinds of Apollo related errors through error.networkError, error.clientErrors, error.graphQLErrors, etc.
    console.error(error);
  }
}
```

## Donate

If you appreciate the work that went into this package, please consider [donating](https://github.com/sponsors/dreamonkey).

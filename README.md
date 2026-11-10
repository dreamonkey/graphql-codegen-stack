# GraphQL Code Generator Stack

A collection of packages to help you generate code from GraphQL documents and use them easily in your code.

## Packages

- [@dreamonkey/graphql-codegen-vue-apollo-plugin](./packages/codegen-plugin) - Auto-generated Vue Apollo composables on steroids 🚀 powered by GraphQL Code Generator
- [@dreamonkey/graphql-codegen-near-operation-file](./packages/near-operation-file) - Write your documents in `.graphql` files, then import the generated code from `.graphql` files in your code!
- [@dreamonkey/graphql-codegen-vue-query-block](./packages/vue-query-block) - Custom `<query>` block to define GraphQL documents in Vue SFCs
- TODO: [@dreamonkey/app-extension-graphql-codegen](./packages/app-extension) - GraphQL Code Generator scaffolding and integration with all the packages in this repo for [Quasar Framework](https://quasar.dev/) as an App Extension

## Testing

Run `pnpm test`. The command runs the end-to-end tests in `e2e/` with Vitest.
The tests build and pack each package, then install the tarballs into two projects.
The `minimum` project uses the oldest supported versions, and the `latest` project uses the newest.
Each project runs GraphQL Code Generator, type-checks the output, and runs a Vite build.

To test one project, filter by its name: `pnpm test -t latest`.

## Donate

If you appreciate the work that went into these packages, please consider [donating](https://github.com/sponsors/dreamonkey).

import vue from '@vitejs/plugin-vue';
import nearOperationFile from '@dreamonkey/graphql-codegen-near-operation-file';
import vueQueryBlock from '@dreamonkey/graphql-codegen-vue-query-block/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue(), nearOperationFile(), vueQueryBlock()],
  build: { minify: false },
});

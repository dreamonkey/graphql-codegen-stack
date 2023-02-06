import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./index', './vite-plugin'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
});

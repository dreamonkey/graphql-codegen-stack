// eslint-disable-next-line @typescript-eslint/no-unsafe-call
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,

  parserOptions: {
    // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser#parseroptionstsconfigrootdir
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
  },

  env: {
    node: true,
    browser: false,
  },

  extends: ['coralloy'],

  rules: {
    '@typescript-eslint/no-var-requires': 'off',
  },
};

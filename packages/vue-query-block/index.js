const { readFile } = require('node:fs/promises');
const { parse: parseVueSfc } = require('@vue/compiler-sfc');
const { parse: parseGraphqlDocument } = require('graphql');

/**
 * @param {string} pointer
 * @returns {Promise<import('graphql').DocumentNode | undefined>}
 */
module.exports = async (pointer) => {
  if (!pointer.endsWith('.vue')) {
    return;
  }

  const contents = await readFile(pointer, 'utf-8');
  const { errors, descriptor } = parseVueSfc(contents);
  if (errors.length > 0) {
    return;
  }

  const queryBlock = descriptor.customBlocks.find(
    ({ type }) => type === 'query',
  );
  const source = queryBlock?.content;
  if (!source) {
    return;
  }

  return parseGraphqlDocument(source);
};

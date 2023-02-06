import { readFile } from 'node:fs/promises';
import { parse as parseVueSfc } from '@vue/compiler-sfc';
import { parse as parseGraphqlDocument, type DocumentNode } from 'graphql';

export default async function (
  pointer: string,
): Promise<DocumentNode | undefined> {
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
}

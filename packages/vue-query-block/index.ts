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
  const { errors, descriptor } = parseVueSfc(contents, { filename: pointer });
  if (errors.length > 0) {
    const messages = errors.map((error) => error.message).join('\n');
    throw new Error(`Failed to parse the Vue SFC at ${pointer}:\n${messages}`);
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

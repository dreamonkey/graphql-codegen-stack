import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import { beforeAll, describe, expect, test } from 'vitest';

const fixturesDir = join(import.meta.dirname, 'fixtures');
const variants = ['minimum', 'latest'];
const moduleResolutionFlags = {
  bundler: ['--module', 'preserve', '--moduleResolution', 'bundler'],
  node10: ['--module', 'esnext', '--moduleResolution', 'node10'],
  nodenext: ['--module', 'nodenext', '--moduleResolution', 'nodenext'],
};
// Vitest sets NODE_ENV to "test". GraphQL Code Generator prints nothing when NODE_ENV is "test".
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name !== 'NODE_ENV'),
);
const BROKEN_SFC =
  '<template><div>\n<query lang="graphql">\nquery broken { count }\n</query>\n';

describe.each(variants)('%s', (variant) => {
  const variantDir = join(import.meta.dirname, variant);
  const execaOptions = { cwd: variantDir, env: childEnv, extendEnv: false };
  const pnpm = (args: string[]) => execa('pnpm', args, execaOptions);

  async function runFailingCodegen(configFileName: string) {
    const result = await execa(
      'pnpm',
      ['exec', 'graphql-codegen', '--config', configFileName],
      { ...execaOptions, all: true, reject: false },
    );
    expect(result.failed).toBe(true);
    return result.all;
  }

  async function writeCodegenConfig(
    fileName: string,
    transform: (config: string) => string,
  ) {
    const config = await readFile(join(variantDir, 'codegen.ts'), 'utf-8');
    await writeFile(join(variantDir, fileName), transform(config));
  }

  beforeAll(async () => {
    // Removing node_modules makes pnpm resolve the newest versions in each range again.
    for (const directory of ['src', 'node_modules']) {
      await rm(join(variantDir, directory), { recursive: true, force: true });
    }
    await cp(fixturesDir, variantDir, { recursive: true });
    await pnpm(['install']);
  });

  test('generates code', async () => {
    await pnpm(['exec', 'graphql-codegen', '--config', 'codegen.ts']);
  });

  test.each(Object.entries(moduleResolutionFlags))(
    'type-checks the generated code with %s module resolution',
    async (_moduleResolution, flags) => {
      await pnpm(['exec', 'tsc', '-p', 'tsconfig.json', ...flags]);
    },
  );

  test('builds the app with Vite', async () => {
    await pnpm(['exec', 'vite', 'build']);
  });

  test('rejects an output file that is not TypeScript', async () => {
    await writeCodegenConfig('codegen.js-output.ts', (config) =>
      config.replace("extension: '.graphql.ts'", "extension: '.graphql.js'"),
    );

    expect(await runFailingCodegen('codegen.js-output.ts')).toContain(
      'requires the output file extension to be one of',
    );
  });

  test('reports Vue SFC parse errors', async () => {
    await mkdir(join(variantDir, 'src/broken'), { recursive: true });
    await writeFile(join(variantDir, 'src/broken/Broken.vue'), BROKEN_SFC);
    await writeCodegenConfig('codegen.broken-sfc.ts', (config) =>
      config.replace('src/components/PostCount.vue', 'src/broken/Broken.vue'),
    );

    expect(await runFailingCodegen('codegen.broken-sfc.ts')).toContain(
      'Failed to parse the Vue SFC at src/broken/Broken.vue',
    );
  });
});

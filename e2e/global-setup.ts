import { mkdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';

const tarballDir = join(import.meta.dirname, '.tarballs');

const repoDir = join(import.meta.dirname, '..');
const packagesToPack = [
  'codegen-plugin',
  'near-operation-file',
  'vue-query-block',
];

// The variant projects install the packed tarballs. A workspace link would resolve peers from the package's own dev dependencies.
export default async function setup() {
  await execa('pnpm', ['run', 'build'], { cwd: repoDir });

  await rm(tarballDir, { recursive: true, force: true });
  await mkdir(tarballDir);
  for (const packageName of packagesToPack) {
    const { stdout } = await execa(
      'pnpm',
      ['pack', '--pack-destination', tarballDir],
      { cwd: join(repoDir, 'packages', packageName) },
    );
    const tarballPath = stdout.trim().split('\n').at(-1);
    if (!tarballPath) {
      throw new Error(`pnpm pack printed no tarball path for ${packageName}`);
    }
    await rename(tarballPath, join(tarballDir, `${packageName}.tgz`));
  }
}

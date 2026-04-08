import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

test('users API module typechecks', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(packageRoot, 'node_modules/typescript/bin/tsc'), '--noEmit'],
    {
      cwd: packageRoot,
      encoding: 'utf8',
    }
  );

  assert.equal(
    result.status,
    0,
    result.stderr || result.stdout || 'TypeScript compilation failed'
  );
});

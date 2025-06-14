import { expect, test } from '@jest/globals';
import { mkdtempSync, copyFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'scripts', 'generate-env.js');
const exampleSrc = path.join(repoRoot, '.env.example');

function runScript(cwd: string) {
  const result = spawnSync('node', [script], { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  expect(result.status).toBe(0);
}

test('generate-env creates .env with new JWT_SECRET', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'envtest-'));
  try {
    const exampleDest = path.join(dir, '.env.example');
    copyFileSync(exampleSrc, exampleDest);

    runScript(dir);

    const envPath = path.join(dir, '.env');
    expect(existsSync(envPath)).toBe(true);

    const envContent = readFileSync(envPath, 'utf8');
    const exampleContent = readFileSync(exampleDest, 'utf8');

    const envSecret = envContent.match(/^JWT_SECRET=(.*)$/m)?.[1];
    const exampleSecret = exampleContent.match(/^JWT_SECRET=(.*)$/m)?.[1];

    expect(envSecret).toBeDefined();
    expect(envSecret).not.toBe(exampleSecret);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
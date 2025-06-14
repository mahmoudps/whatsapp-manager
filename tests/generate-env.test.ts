import { expect, test } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const repoRoot = path.resolve(__dirname, '..');

function runGenerateEnv(cwd: string) {
  const scriptPath = path.join(repoRoot, 'scripts', 'generate-env.js');
  execFileSync('node', [scriptPath], { cwd });
}

test('generate-env creates .env with new JWT_SECRET', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
  const exampleSource = path.join(repoRoot, '.env.example');
  const exampleDest = path.join(tmpDir, '.env.example');

  fs.copyFileSync(exampleSource, exampleDest);

  runGenerateEnv(tmpDir);

  const envPath = path.join(tmpDir, '.env');
  expect(fs.existsSync(envPath)).toBe(true);

  const exampleContent = fs.readFileSync(exampleSource, 'utf8');
  const exampleSecret = /^JWT_SECRET=(.*)$/m.exec(exampleContent)?.[1];
  const envContent = fs.readFileSync(envPath, 'utf8');
  const secret = /^JWT_SECRET=(.*)$/m.exec(envContent)?.[1];

  expect(secret).toBeDefined();
  expect(secret).not.toBe(exampleSecret);
});

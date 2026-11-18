import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Packed package validation test', () => {
  it('executes full pack & install smoke test cleanly', () => {
    const output = execSync('node scripts/pack-test.js', { cwd: rootDir, encoding: 'utf8' });
    assert.ok(output.includes('All smoke tests passed on packed tarball!'));
  });
});

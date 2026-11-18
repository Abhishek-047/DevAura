import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- PACK & TARBALL INTEGRATION TEST ---');

// 1. Pack the package
const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf8' }).trim();
const tarballName = packOutput.split('\n').pop().trim();
const tarballPath = path.join(rootDir, tarballName);

console.log(`Generated tarball: ${tarballName}`);

// 2. Create isolated temp test project
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devaura-smoke-'));
console.log(`Testing installation in clean temp directory: ${tmpDir}`);

try {
  fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'smoke-test', type: 'module' }, null, 2)
  );

  // Install the packed tarball
  execSync(`npm install "${tarballPath}"`, { cwd: tmpDir, stdio: 'inherit' });

  // 3. Test ESM resolution in fresh project
  console.log('Testing ESM import from fresh project...');
  fs.writeFileSync(
    path.join(tmpDir, 'smoke.js'),
    `
    import { success, createLogger } from 'devaura/server';
    import { createSnow, SNOW_DEFAULTS } from 'devaura/effects';

    console.log('ESM Server import OK:', typeof success);
    console.log('ESM Effects import in Node OK:', typeof createSnow, 'defaults count:', SNOW_DEFAULTS.COUNT);
    `
  );
  execSync('node smoke.js', { cwd: tmpDir, stdio: 'inherit' });

  // 4. Test CJS resolution in fresh project
  console.log('Testing CJS require from fresh project...');
  fs.writeFileSync(
    path.join(tmpDir, 'smoke.cjs'),
    `
    const { success, createLogger } = require('devaura/server');
    const { createSnow, SNOW_DEFAULTS } = require('devaura/effects');

    console.log('CJS Server require OK:', typeof success);
    console.log('CJS Effects require OK:', typeof createSnow, 'defaults count:', SNOW_DEFAULTS.COUNT);
    `
  );
  execSync('node smoke.cjs', { cwd: tmpDir, stdio: 'inherit' });

  // 5. Test IIFE browser bundle evaluation
  console.log('Testing IIFE browser bundle global DevAura assignment...');
  fs.writeFileSync(
    path.join(tmpDir, 'smoke-iife.cjs'),
    `
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');

    const bundlePath = path.join('node_modules', 'devaura', 'dist', 'devaura-effects.iife.min.js');
    const bundleCode = fs.readFileSync(bundlePath, 'utf8');

    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(bundleCode, sandbox);

    if (!sandbox.DevAura || typeof sandbox.DevAura.createSnow !== 'function') {
      throw new Error('DevAura global missing on sandbox');
    }
    console.log('IIFE global DevAura OK:', typeof sandbox.DevAura.createSnow);
    `
  );
  execSync('node smoke-iife.cjs', { cwd: tmpDir, stdio: 'inherit' });

  console.log('All smoke tests passed on packed tarball!');
} finally {
  if (fs.existsSync(tarballPath)) fs.unlinkSync(tarballPath);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

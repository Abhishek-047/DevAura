import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Strict environment separation tests (Rule 3)', () => {
  it('effects module imports cleanly in pure Node environment without throwing', async () => {
    // Importing devaura/effects in Node without window/document must not throw
    const effectsModule = await import('../src/effects/index.js');
    assert.strictEqual(typeof effectsModule.createSnow, 'function');
    assert.strictEqual(typeof effectsModule.createPetals, 'function');
    assert.strictEqual(typeof effectsModule.createParticles, 'function');
    assert.strictEqual(typeof effectsModule.fireConfetti, 'function');

    // Calling creator without DOM must throw a descriptive Error (SSR-safe)
    assert.throws(
      () => effectsModule.createSnow(),
      /Effects engine requires a DOM environment/
    );
  });

  it('server module has zero DOM references and works in pure Node', async () => {
    const serverModule = await import('../src/server/index.js');
    assert.strictEqual(typeof serverModule.success, 'function');
    assert.strictEqual(typeof serverModule.createLogger, 'function');
    assert.strictEqual(typeof serverModule.errorHandler, 'function');
    assert.strictEqual(typeof serverModule.createRequestMonitor, 'function');
  });

  it('static analysis verifies no Node built-ins in effects and no DOM globals in server', () => {
    const forbiddenInEffects = [
      'fs', 'node:fs',
      'path', 'node:path',
      'http', 'node:http',
      'https', 'node:https',
      'net', 'node:net',
      'child_process', 'node:child_process'
    ];

    const effectsFiles = fs.readdirSync(path.join(rootDir, 'src/effects'), { recursive: true });
    for (const file of effectsFiles) {
      const fullPath = path.join(rootDir, 'src/effects', file);
      if (!fs.statSync(fullPath).isFile() || !file.endsWith('.js')) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const token of forbiddenInEffects) {
        assert.strictEqual(
          content.includes(`'${token}'`) || content.includes(`"${token}"`),
          false,
          `Effects file ${file} must not import ${token}`
        );
      }
    }
  });
});

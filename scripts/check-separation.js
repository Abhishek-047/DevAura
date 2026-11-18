import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const NODE_BUILTINS = [
  'fs', 'node:fs',
  'path', 'node:path',
  'http', 'node:http',
  'https', 'node:https',
  'net', 'node:net',
  'os', 'node:os',
  'crypto', 'node:crypto',
  'child_process', 'node:child_process',
  'stream', 'node:stream',
  'events', 'node:events'
];

function checkFiles(dir, forbiddenTokens, label) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (!fs.statSync(fullPath).isFile() || !file.endsWith('.js')) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const token of forbiddenTokens) {
      if (content.includes(`'${token}'`) || content.includes(`"${token}"`)) {
        throw new Error(`[separation check] ${label} file "${file}" imports or references forbidden token: "${token}"`);
      }
    }
  }
}

console.log('Checking environment separation rules...');

// Rule: effects must never import Node built-ins
checkFiles(path.join(rootDir, 'src/effects'), NODE_BUILTINS, 'Effects');

// Rule: server must not reference browser globals at module load
checkFiles(path.join(rootDir, 'src/server'), ['window.', 'document.'], 'Server');

console.log('Static separation check passed!');

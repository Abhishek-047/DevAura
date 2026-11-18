import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.join(rootDir, 'project.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const packageJson = {
  name: config.name || 'devaura',
  version: config.version || '0.1.0',
  description: config.description || 'Zero-dependency toolkit for effects and server utils',
  type: 'module',
  main: './dist/cjs/server/index.cjs',
  module: './dist/esm/server/index.js',
  types: './types/server.d.ts',
  exports: {
    './effects': {
      browser: {
        types: {
          import: './types/effects.d.ts',
          require: './types/effects.d.cts'
        },
        import: './dist/esm/effects/index.js',
        require: './dist/cjs/effects/index.cjs'
      },
      types: {
        import: './types/effects.d.ts',
        require: './types/effects.d.cts'
      },
      import: './dist/esm/effects/index.js',
      require: './dist/cjs/effects/index.cjs'
    },
    './server': {
      types: {
        import: './types/server.d.ts',
        require: './types/server.d.cts'
      },
      import: './dist/esm/server/index.js',
      require: './dist/cjs/server/index.cjs'
    }
  },
  files: [
    'dist',
    'types',
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'LEARNING.md'
  ],
  sideEffects: false,
  scripts: {
    build: 'node scripts/build.js',
    prepack: 'node scripts/build.js',
    prepublishOnly: 'node scripts/prepublish-check.js',
    test: 'node --test tests/**/*.test.js',
    'test:separation': 'node tests/separation.test.js',
    'test:package': 'node tests/package.test.js'
  },
  engines: {
    node: `>=${config.minNodeVersion || '18'}`
  },
  repository: {
    type: 'git',
    url: `git+https://github.com/${config.repository}.git`
  },
  keywords: [
    'canvas',
    'effects',
    'snow',
    'particles',
    'petals',
    'confetti',
    'express',
    'logger',
    'request-monitor',
    'error-handler',
    'response-helper'
  ],
  author: config.author,
  license: config.license || 'MIT',
  bugs: {
    url: `https://github.com/${config.repository}/issues`
  },
  homepage: `https://github.com/${config.repository}#readme`,
  devDependencies: {
    '@arethetypeswrong/cli': '^0.17.4',
    esbuild: '^0.25.0',
    express: '^4.21.2',
    jsdom: '^26.0.0',
    publint: '^0.3.8'
  }
};

fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
console.log('Successfully updated package.json');

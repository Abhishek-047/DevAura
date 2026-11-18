// Build script for DevAura using esbuild
import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Clean dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

async function build() {
  console.log('Building DevAura...');

  // 1. ESM build for effects & server
  await esbuild.build({
    entryPoints: {
      'effects/index': path.join(rootDir, 'src/effects/index.js'),
      'server/index': path.join(rootDir, 'src/server/index.js')
    },
    outdir: path.join(distDir, 'esm'),
    format: 'esm',
    bundle: true,
    platform: 'neutral',
    target: ['es2022'],
    sourcemap: true,
    packages: 'external'
  });

  // 2. CJS build for effects & server
  await esbuild.build({
    entryPoints: {
      'effects/index': path.join(rootDir, 'src/effects/index.js'),
      'server/index': path.join(rootDir, 'src/server/index.js')
    },
    outdir: path.join(distDir, 'cjs'),
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    bundle: true,
    platform: 'node',
    target: ['es2022'],
    sourcemap: true,
    packages: 'external'
  });

  // 3. Browser IIFE minified bundle for CDN/script-tag
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/effects/index.js')],
    outfile: path.join(distDir, 'devaura-effects.iife.min.js'),
    format: 'iife',
    globalName: 'DevAura',
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ['es2020']
  });

  console.log('Build completed successfully.');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

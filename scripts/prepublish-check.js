import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- PREPUBLISH VALIDATION CHECKS ---');

function run(cmd, desc) {
  console.log(`Running: ${desc} (${cmd})...`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

try {
  run('node scripts/build.js', 'Build packages');
  run('node scripts/check-separation.js', 'Environment separation check');
  run('node --test tests/effects/edgeCases.test.js tests/server/server.test.js tests/separation.test.js tests/package.test.js', 'Test suite');
  run('npx publint', 'Publint packaging check');
  run('npx attw --pack . --ignore-rules no-resolution', 'AreTheTypesWrong type resolution check');
  console.log('All prepublish checks passed successfully!');
} catch (err) {
  console.error('Prepublish checks failed:', err);
  process.exit(1);
}

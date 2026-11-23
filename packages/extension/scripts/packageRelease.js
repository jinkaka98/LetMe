import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pyScript = path.join(__dirname, 'packageRelease.py');

try {
  execSync(`python3 "${pyScript}"`, { stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}

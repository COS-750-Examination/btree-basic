// One-shot local setup: creates server/.env from .env.example with a fresh JWT secret.
// Cross-platform (macOS, Linux, WSL, Windows) because it only uses Node built-ins.
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const example = join(root, '.env.example');
const target = join(root, 'server', '.env');

if (existsSync(target)) {
  console.log('server/.env already exists, leaving it untouched.');
} else {
  copyFileSync(example, target);
  const secret = randomBytes(48).toString('hex');
  const contents = readFileSync(target, 'utf8').replace(
    /JWT_SECRET=".*"/,
    `JWT_SECRET="${secret}"`,
  );
  writeFileSync(target, contents);
  console.log('Created server/.env with a generated JWT_SECRET.');
}

console.log('\nNext steps:');
console.log('  npm run db:up       # start PostgreSQL in Docker');
console.log('  npm run db:migrate  # create tables');
console.log('  npm run db:seed     # demo user + decorations');
console.log('  npm run dev         # client http://localhost:5173, API http://localhost:4000');

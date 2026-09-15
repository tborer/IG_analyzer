import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { E2E_DB_PATH } from '../playwright.config';

// Fresh database per run -- deletes any leftover file from a previous run,
// then applies schema.sql the same way production does (scripts/init-db.mjs),
// just pointed at a local file instead of Turso.
export default function globalSetup() {
  if (existsSync(E2E_DB_PATH)) unlinkSync(E2E_DB_PATH);

  execFileSync('node', [path.resolve(__dirname, '../scripts/init-db.mjs')], {
    env: { ...process.env, TURSO_DATABASE_URL: `file:${E2E_DB_PATH}` },
    stdio: 'inherit',
  });
}

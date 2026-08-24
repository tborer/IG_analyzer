// Applies schema.sql against your Turso database.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:init
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error('Missing TURSO_DATABASE_URL env var.');
  process.exit(1);
}

const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const client = createClient({ url, authToken });

try {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.execute(statement);
  }

  // `create table if not exists` above doesn't retrofit new columns onto a
  // users table created by an older schema.sql -- add them here, once, if missing.
  const columns = await client.execute('pragma table_info(users)');
  const hasPlan = columns.rows.some((row) => row.name === 'plan');
  if (!hasPlan) {
    await client.execute("alter table users add column plan text not null default 'free'");
    console.log('Added missing `plan` column to users.');
  }

  console.log('Schema applied successfully.');
} catch (err) {
  console.error('Failed to apply schema:', err);
  process.exit(1);
} finally {
  client.close();
}

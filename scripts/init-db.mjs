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

// `create table if not exists` doesn't retrofit new columns onto a table
// created by an older schema.sql -- add them here, once, if missing.
async function ensureColumn(table, column, definition) {
  const info = await client.execute(`pragma table_info(${table})`);
  const hasColumn = info.rows.some((row) => row.name === column);
  if (!hasColumn) {
    await client.execute(`alter table ${table} add column ${column} ${definition}`);
    console.log(`Added missing \`${column}\` column to ${table}.`);
  }
}

try {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.execute(statement);
  }

  // active | past_due | canceled | incomplete | null
  await ensureColumn('users', 'subscription_status', 'TEXT');
  // ISO datetime
  await ensureColumn('users', 'current_period_end', 'TEXT');
  await ensureColumn('users', 'stripe_customer_id', 'TEXT');
  await ensureColumn('users', 'stripe_subscription_id', 'TEXT');
  await ensureColumn('users', 'email_verified_at', 'TEXT');
  await ensureColumn('users', 'sessions_invalidated_at', 'TEXT');
  await ensureColumn('users', 'token_allotment', 'INTEGER');
  await ensureColumn('users', 'token_period_start', 'TEXT');

  await ensureColumn('audits', 'transcribed_bio', 'TEXT');

  console.log('Schema applied successfully.');
} catch (err) {
  console.error('Failed to apply schema:', err);
  process.exit(1);
} finally {
  client.close();
}

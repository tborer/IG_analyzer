import { createClient, type Client, type InArgs } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: Client | undefined;
}

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Add it to your environment (see .env.example).'
    );
  }
  return createClient({ url, authToken });
}

// Created lazily on first query, not at module load — so importing this file
// (e.g. during `next build`'s page-data collection) never throws just because
// env vars aren't present yet.
function getClient(): Client {
  if (!global.__tursoClient) {
    global.__tursoClient = createDbClient();
  }
  return global.__tursoClient;
}

export async function query<T = any>(sql: string, params: InArgs = []): Promise<T[]> {
  const client = getClient();
  const result = await client.execute({ sql, args: params });
  return result.rows as unknown as T[];
}

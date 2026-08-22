-- Run this once against your Turso database.
-- Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:init

create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists audits (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  bio_text text,
  photo_count integer not null default 0,
  result text not null,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_audits_user_id on audits(user_id);

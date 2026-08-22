-- Run this once against your Postgres database (Neon, Supabase, etc.)
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bio_text text,
  photo_count int not null default 0,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audits_user_id on audits(user_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT, -- active | past_due | canceled | incomplete | null
  current_period_end TEXT, -- ISO datetime
  email_verified_at TEXT, -- ISO datetime, null until verified
  sessions_invalidated_at TEXT, -- ISO datetime, tokens issued before this are rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bio_text TEXT,
  photo_count INTEGER NOT NULL,
  result TEXT,
  transcribed_bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  succeeded INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- §1.4 session revocation: per-session denylist for explicit logout.
CREATE TABLE IF NOT EXISTS revoked_sessions (
  sid TEXT PRIMARY KEY,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- §1.5 forgot-password. token is stored as a SHA-256 hash, never the raw
-- value handed out in the email link, so a DB leak can't be replayed.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- §1.5 email verification, same hashed-token pattern.
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

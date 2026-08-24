import { beforeAll, describe, expect, it } from 'vitest';
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from '@/lib/auth';

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

describe('password hashing', () => {
  it('verifies a matching password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });
});

describe('session tokens', () => {
  it('round-trips a user id through create/verify', async () => {
    const token = await createSessionToken('user-123');
    expect(await verifySessionToken(token)).toBe('user-123');
  });

  it('rejects a garbage token', async () => {
    expect(await verifySessionToken('not-a-real-token')).toBeNull();
  });
});

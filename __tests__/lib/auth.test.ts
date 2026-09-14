import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('password hashing', () => {
  it('verifies a matching password and rejects a wrong one', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/auth');
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });
});

describe('session tokens', () => {
  it('round-trips a user id through create/verify when not revoked', async () => {
    const { query } = await import('@/lib/db');
    const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
    vi.mocked(query).mockResolvedValueOnce([]); // revoked_sessions lookup: not revoked
    vi.mocked(query).mockResolvedValueOnce([{ sessions_invalidated_at: null }]); // users lookup

    const token = await createSessionToken('user-123');
    expect(await verifySessionToken(token)).toBe('user-123');
  });

  it('rejects a garbage token', async () => {
    const { verifySessionToken } = await import('@/lib/auth');
    expect(await verifySessionToken('not-a-real-token')).toBeNull();
  });

  it('rejects a token whose session id is in the revocation denylist', async () => {
    const { query } = await import('@/lib/db');
    const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
    vi.mocked(query).mockResolvedValueOnce([{ sid: 'revoked' }]); // revoked_sessions: found

    const token = await createSessionToken('user-123');
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects a token issued before the user-wide invalidation cutoff', async () => {
    const { query } = await import('@/lib/db');
    const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
    vi.mocked(query).mockResolvedValueOnce([]); // not individually revoked
    // Cutoff far in the future relative to a token issued "now".
    const futureCutoff = new Date(Date.now() + 60_000).toISOString().replace('T', ' ').slice(0, 19);
    vi.mocked(query).mockResolvedValueOnce([{ sessions_invalidated_at: futureCutoff }]);

    const token = await createSessionToken('user-123');
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('getSessionId extracts the sid claim from a valid token', async () => {
    const { createSessionToken, getSessionId } = await import('@/lib/auth');
    const token = await createSessionToken('user-123');
    expect(await getSessionId(token)).toEqual(expect.any(String));
  });

  it('revokeSession inserts the sid into revoked_sessions', async () => {
    const { query } = await import('@/lib/db');
    const { revokeSession } = await import('@/lib/auth');
    await revokeSession('some-sid');
    expect(query).toHaveBeenCalledWith('insert into revoked_sessions (sid) values (?)', [
      'some-sid',
    ]);
  });

  it('invalidateOtherSessions stamps the user-wide cutoff', async () => {
    const { query } = await import('@/lib/db');
    const { invalidateOtherSessions } = await import('@/lib/auth');
    await invalidateOtherSessions('user-123');
    expect(query).toHaveBeenCalledWith(
      "update users set sessions_invalidated_at = datetime('now') where id = ?",
      ['user-123']
    );
  });
});

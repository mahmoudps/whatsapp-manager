import { beforeEach, expect, jest, test } from '@jest/globals';

beforeEach(() => {
  jest.resetModules();
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

  test('verifyAuth succeeds with valid token', async () => {
    const auth = await import('../lib/auth');
    const token = auth.createAuthToken({ id: 1, username: 'user' });
    const req: any = { cookies: { get: () => ({ value: token }) }, headers: new Headers() };
  const res = await auth.verifyAuth(req);
  expect(res.success).toBe(true);
  expect(res.user).toEqual({ userId: 1, username: 'user', role: 'user' });
  expect(res.clearCookie).toBe(false);
  });

  test('verifyAuth fails with invalid token', async () => {
    const auth = await import('../lib/auth');
    const req: any = { cookies: { get: () => ({ value: 'bad' }) }, headers: new Headers() };
  const res = await auth.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('Invalid token');
  expect(res.clearCookie).toBe(true);
  });

  test('verifyAuth fails when token missing', async () => {
    const auth = await import('../lib/auth');
    const req: any = { cookies: { get: () => undefined }, headers: new Headers() };
  const res = await auth.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('No token provided');
  expect(res.clearCookie).toBe(false);
  });

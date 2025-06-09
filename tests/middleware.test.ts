import { beforeEach, expect, jest, test } from '@jest/globals';

beforeEach(() => {
  jest.resetModules();
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

test('verifyAuth succeeds with valid token', async () => {
  const middleware = await import('../lib/middleware');
  const token = middleware.createAuthToken({ id: 1, username: 'user' });
  const req: any = { cookies: { get: () => ({ value: token }) }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(true);
  expect(res.user).toEqual({ userId: 1, username: 'user', role: 'user' });
});

test('verifyAuth fails with invalid token', async () => {
  const middleware = await import('../lib/middleware');
  const req: any = { cookies: { get: () => ({ value: 'bad' }) }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('Invalid token');
});

test('verifyAuth fails when token missing', async () => {
  const middleware = await import('../lib/middleware');
  const req: any = { cookies: { get: () => undefined }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('No token provided');
});

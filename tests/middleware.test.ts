import { beforeEach, expect, jest, test } from '@jest/globals';

beforeEach(() => {
  jest.resetModules();
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

test('verifyAuth succeeds with valid token and active user', async () => {
  jest.doMock('../lib/database', () => ({ db: { getAdminById: jest.fn().mockResolvedValue({ id: 1, username: 'user', isActive: true }) } }));
  const middleware = await import('../lib/middleware');
  const token = middleware.createAuthToken({ id: 1, username: 'user' });
  const req: any = { cookies: { get: () => ({ value: token }) }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(true);
  expect(res.user).toEqual({ id: 1, username: 'user' });
});

test('verifyAuth fails with invalid token', async () => {
  jest.doMock('../lib/database', () => ({ db: { getAdminById: jest.fn() } }));
  const middleware = await import('../lib/middleware');
  const req: any = { cookies: { get: () => ({ value: 'bad' }) }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('توكن غير صالح');
});

test('verifyAuth fails when user inactive', async () => {
  jest.doMock('../lib/database', () => ({ db: { getAdminById: jest.fn().mockResolvedValue({ id: 1, username: 'user', isActive: false }) } }));
  const middleware = await import('../lib/middleware');
  const token = middleware.createAuthToken({ id: 1, username: 'user' });
  const req: any = { cookies: { get: () => ({ value: token }) }, headers: new Headers() };
  const res = await middleware.verifyAuth(req);
  expect(res.success).toBe(false);
  expect(res.message).toBe('المستخدم غير موجود أو غير مفعل');
});


import { beforeEach, describe, expect, jest, test } from '@jest/globals';

beforeEach(() => {
  jest.resetModules();
  process.env.ADMIN_USERNAME = 'test_admin';
  process.env.ADMIN_PASSWORD = 'test_pass';
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

test('validateLogin succeeds with correct credentials', async () => {
  const { validateLogin } = await import('../lib/auth');
  const user = await validateLogin({ username: 'test_admin', password: 'test_pass' });
  expect(user).toEqual({ id: 1, username: 'test_admin' });
});

test('validateLogin fails with wrong password', async () => {
  const { validateLogin } = await import('../lib/auth');
  const user = await validateLogin({ username: 'test_admin', password: 'wrong' });
  expect(user).toBeNull();
});

test('generateAuthToken creates verifiable token', async () => {
  const { generateAuthToken, verifyToken } = await import('../lib/auth');
  const token = generateAuthToken({ id: 1, username: 'test_admin' });
  const decoded = verifyToken(token);
  expect(decoded.valid).toBe(true);
  expect(decoded.username).toBe('test_admin');
});

test('authenticateUser success without database', async () => {
  jest.doMock('../lib/database', () => ({ db: null }));
  const auth = await import('../lib/auth');
  const res = await auth.authenticateUser('test_admin', 'test_pass');
  expect(res.success).toBe(true);
  expect(res.user?.username).toBe('test_admin');
  expect(res.token).toBeDefined();
});

test('authenticateUser failure with bad credentials', async () => {
  jest.doMock('../lib/database', () => ({ db: null }));
  const auth = await import('../lib/auth');
  const res = await auth.authenticateUser('test_admin', 'bad');
  expect(res.success).toBe(false);
});

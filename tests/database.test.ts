import { afterAll, beforeAll, expect, test } from '@jest/globals';

let db: any;

beforeAll(async () => {
  process.env.DATABASE_PATH = ':memory:';
  process.env.ADMIN_USERNAME = `test_admin_${Date.now()}`;
  const dbModule = await import('../lib/database');
  db = dbModule.db;
  await dbModule.initializeDatabase();
});

afterAll(() => {
  if (db) db.close();
});

test('createDevice inserts a new device', async () => {
  const device = await db.createDevice('Test Device');
  expect(device).toBeDefined();
  expect(device.name).toBe('Test Device');
  expect(device.status).toBe('disconnected');
});

test('createMessage inserts a new message', async () => {
  const device = await db.createDevice('Message Device');
  const message = await db.createMessage({
    deviceId: device.id,
    recipient: '123456789',
    message: 'Hello',
    status: 'sent',
    messageType: 'text',
  });
  expect(message).toBeDefined();
  expect(message.deviceId).toBe(device.id);
  expect(message.message).toBe('Hello');
});

import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock('@/lib/validation', () => ({
  ValidationSchemas: {
    createDevice: jest.fn().mockReturnValue({ name: 'API Device' }),
    createMessage: jest.fn().mockReturnValue({ recipient: '123456789', message: 'hi', deviceId: 1 }),
    contact: jest.fn().mockReturnValue({ name: 'Test Contact', phoneNumber: '12345' }),
  },
}));

jest.mock('@/lib/middleware', () => ({
  verifyAuth: jest.fn().mockResolvedValue({ success: true, user: { id: 1, username: 'test' } })
}));

jest.mock('@/lib/whatsapp-client-manager', () => {
  return {
    whatsappManager: {
      sendMessage: jest.fn().mockResolvedValue(true),
      isClientReady: jest.fn().mockReturnValue(true),
    },
  };
});

let db: any;
let createDevicePost: any;
let sendMessagePost: any;
let analyticsGet: any;

let createContactPost: any;
let whatsappManagerMock: any;

beforeAll(async () => {
  process.env.DATABASE_PATH = ':memory:';
  process.env.ADMIN_USERNAME = `test_admin_${Date.now()}`;
  const dbModule = await import('../lib/database');
  db = dbModule.db;
  await dbModule.initializeDatabase();

  const managerModule = await import('../lib/whatsapp-client-manager');
  whatsappManagerMock = managerModule.whatsappManager;

  createDevicePost = (await import('../app/api/devices/route')).POST;
  sendMessagePost = (await import('../app/api/devices/[id]/send/route')).POST;
  analyticsGet = (await import('../app/api/analytics/route')).GET;

  createContactPost = (await import('../app/api/contacts/route')).POST;
});

afterAll(() => {
  if (db) db.close();
});

test('POST /api/devices creates a device', async () => {
  const req: any = {
    json: async () => ({ name: 'API Device' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    cookies: { get: () => undefined },
  };

  const res = await createDevicePost(req);
  const data = await res.json();
  expect(res.status).toBe(201);
  expect(data.success).toBe(true);
  expect(data.device).toBeDefined();
});

test('POST /api/devices/[id]/send sends a message', async () => {
  const device = await db.createDevice('Send Device');

  const req: any = {
    json: async () => ({ recipient: '123456789', message: 'hi' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    cookies: { get: () => undefined },
  };

  const res = await sendMessagePost(req, { params: { id: String(device.id) } });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(whatsappManagerMock.sendMessage).toHaveBeenCalled();
});

test('GET /api/analytics returns summary', async () => {
  await db.createAnalyticsEvent({ eventType: 'test_api' });
  const req: any = { url: 'http://localhost/api/analytics', headers: new Headers(), cookies: { get: () => undefined } };
  const res = await analyticsGet(req);
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.summary)).toBe(true);


test('POST /api/contacts creates a contact', async () => {
  const req: any = {
    json: async () => ({ name: 'Test Contact', phoneNumber: '12345' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    cookies: { get: () => undefined },
  };

  const res = await createContactPost(req);
  const data = await res.json();
  expect(res.status).toBe(201);
  expect(data.success).toBe(true);
  expect(data.contact).toBeDefined();
});

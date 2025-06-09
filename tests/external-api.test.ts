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
    message: jest.fn().mockReturnValue({ to: '123456789', message: 'hi' }),
  },
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
let sendExternalPost: any;
let whatsappManagerMock: any;

beforeAll(async () => {
  process.env.DATABASE_PATH = ':memory:';
  process.env.EXTERNAL_API_KEY = 'testkey';
  process.env.ADMIN_USERNAME = `test_admin_${Date.now()}`;
  const dbModule = await import('../lib/database');
  db = dbModule.db;
  await dbModule.initializeDatabase();

  const managerModule = await import('../lib/whatsapp-client-manager');
  whatsappManagerMock = managerModule.whatsappManager;

  sendExternalPost = (await import('../app/api/external/send-message/route')).POST;
});

afterAll(() => {
  if (db) db.close();
});

test('rejects requests without API key', async () => {
  const req: any = {
    json: async () => ({ deviceId: 1, recipient: '123', message: 'hi' }),
    headers: new Headers(),
    url: 'http://localhost/api/external/send-message',
  };

  const res = await sendExternalPost(req);
  const data = await res.json();
  expect(res.status).toBe(401);
  expect(data.success).toBe(false);
});

test('sends message when API key is valid', async () => {
  const device = await db.createDevice({ name: 'External Device' });
  const req: any = {
    json: async () => ({ deviceId: device.id, recipient: '123456789', message: 'hi' }),
    headers: new Headers({ 'X-API-Key': 'testkey', 'Content-Type': 'application/json' }),
    url: 'http://localhost/api/external/send-message',
  };

  const res = await sendExternalPost(req);
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(whatsappManagerMock.sendMessage).toHaveBeenCalled();
});

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
    message: jest.fn().mockReturnValue({ to: '123456789', message: 'hi' }),
    contact: jest.fn().mockReturnValue({ name: 'Test Contact', phoneNumber: '12345' }),
  },
}));


jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn().mockResolvedValue({ success: true, user: { id: 1, username: 'test' } })
}));

jest.mock('@/lib/whatsapp-client-manager', () => {
  return {
    whatsappManager: {
      sendMessage: jest.fn().mockResolvedValue(true),
      isClientReady: jest.fn().mockReturnValue(true),
      createClient: jest.fn().mockResolvedValue({ success: true }),
    },
  };
});

let db: any;
let createDevicePost: any;
let sendMessagePost: any;
let connectPost: any;
let analyticsGet: any;

let createContactPost: any;
let whatsappManagerMock: any;
let statsGet: any;
let devicesGet: any;
let socketStatusGet: any;

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
  connectPost = (await import('../app/api/devices/[id]/connect/route')).POST;
  analyticsGet = (await import('../app/api/analytics/route')).GET;
  statsGet = (await import('../app/api/stats/route')).GET;
  devicesGet = (await import('../app/api/devices/route')).GET;
  socketStatusGet = (await import('../app/api/socket/status/route')).GET;

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
  const device = await db.createDevice({ name: 'Send Device' });

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

test('POST /api/devices/[id]/connect returns error detail on failure', async () => {
  const device = await db.createDevice({ name: 'Connect Device' });
  whatsappManagerMock.createClient.mockResolvedValueOnce({ success: false, error: 'init failed' });

  const req: any = { headers: new Headers(), cookies: { get: () => undefined } };
  const res = await connectPost(req, { params: { id: String(device.id) } });
  const data = await res.json();

  expect(res.status).toBe(500);
  expect(data.success).toBe(false);
  expect(data.error).toBe('init failed');
});

test('GET /api/analytics returns summary', async () => {
  await db.createAnalyticsEvent({ eventType: 'test_api' });
  const req: any = { url: 'http://localhost/api/analytics', headers: new Headers(), cookies: { get: () => undefined } };
  const res = await analyticsGet(req);
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.summary)).toBe(true);
});


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

test('GET /api/stats returns numeric stats', async () => {
  const req: any = { url: 'http://localhost/api/stats', headers: new Headers(), cookies: { get: () => undefined } };
  const res = await statsGet(req);
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(typeof data.stats.totalDevices).toBe('number');
  expect(typeof data.stats.connectedDevices).toBe('number');
  expect(typeof data.stats.totalMessages).toBe('number');
  expect(typeof data.stats.sentMessages).toBe('number');
});

test('GET /api/devices returns devices array', async () => {
  await db.createDevice({ name: 'List Device' });
  const req: any = { url: 'http://localhost/api/devices', headers: new Headers(), cookies: { get: () => undefined } };
  const res = await devicesGet(req);
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.devices)).toBe(true);
});

test('GET /api/socket/status reports running when health check succeeds', async () => {
  process.env.ENABLE_WEBSOCKET = 'true';
  process.env.WEBSOCKET_PORT = '1234';
  process.env.NEXT_PUBLIC_WEBSOCKET_URL = 'wss://ws.example.com:1234/ws/socket.io';
  const mockFetch = global.fetch as jest.Mock;
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ stats: { socketIOConnections: 5 } }),
  });

  const res = await socketStatusGet();
  const data = await res.json();
  expect(mockFetch).toHaveBeenCalledWith('https://ws.example.com:1234/health');
  expect(res.status).toBe(200);
  expect(data.status).toBe('running');
  expect(data.clients).toBe(5);
});

test('GET /api/socket/status reports error when health check fails', async () => {
  process.env.ENABLE_WEBSOCKET = 'true';
  process.env.WEBSOCKET_PORT = '1234';
  process.env.NEXT_PUBLIC_WEBSOCKET_URL = 'ws://ws.example.com:1234/ws/socket.io';
  const mockFetch = global.fetch as jest.Mock;
  mockFetch.mockRejectedValueOnce(new Error('connection refused'));

  const res = await socketStatusGet();
  const data = await res.json();
  expect(mockFetch).toHaveBeenCalledWith('http://ws.example.com:1234/health');
  expect(res.status).toBe(200);
  expect(data.status).toBe('error');
  expect(data.message).toMatch(/connection refused/i);
});

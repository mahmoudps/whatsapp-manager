import { beforeEach, expect, jest, test } from '@jest/globals';

jest.mock('http', () => ({ createServer: jest.fn(() => ({ listen: jest.fn() })) }));

jest.mock('express', () => {
  const app = { use: jest.fn(), get: jest.fn(), post: jest.fn() };
  const express = jest.fn(() => app);
  express.json = jest.fn(() => 'jsonMiddleware');
  return express;
});

jest.mock('cors', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));
jest.mock('helmet', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));
jest.mock('compression', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));

jest.mock('socket.io', () => {
  const emitMock = jest.fn();
  const toEmitMock = jest.fn();
  const toMock = jest.fn(() => ({ emit: toEmitMock }));
  return {
    Server: jest.fn(() => ({ emit: emitMock, to: toMock, on: jest.fn(), use: jest.fn(), engine: { clientsCount: 0 } })),
    emitMock,
    toMock,
    toEmitMock,
  };
});

jest.mock('ws', () => {
  const wsSendMock = jest.fn();
  const wsClient = { readyState: 1, send: wsSendMock };
  const wsClients = { forEach: (cb: any) => cb(wsClient), size: 1 };
  return {
    Server: jest.fn(() => ({ clients: wsClients, on: jest.fn() })),
    OPEN: 1,
    wsSendMock,
  };
});

beforeEach(() => {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

test('broadcastToAll emits via io and ws', async () => {
  await import('../websocket-server.js');
  const { emitMock } = require('socket.io');
  const { wsSendMock } = require('ws');
  global.wsServer.broadcastToAll('test', { ok: true });
  expect(emitMock).toHaveBeenCalledWith('test', { ok: true });
  expect(wsSendMock).toHaveBeenCalled();
});

test('broadcastToDevice emits to specific room', async () => {
  await import('../websocket-server.js');
  const { toMock, toEmitMock } = require('socket.io');
  global.wsServer.broadcastToDevice('123', 'evt', { val: 1 });
  expect(toMock).toHaveBeenCalledWith('device_123');
  expect(toEmitMock).toHaveBeenCalledWith('evt', { val: 1 });
});

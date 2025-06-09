import { beforeEach, expect, jest, test } from '@jest/globals';

jest.mock('http', () => ({ createServer: jest.fn(() => ({ listen: jest.fn(), close: jest.fn() })) }));

jest.mock('express', () => {
  const app = { use: jest.fn() };
  const express = jest.fn(() => app);
  express.json = jest.fn(() => 'jsonMiddleware');
  return express;
});

jest.mock('cors', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));
jest.mock('helmet', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));
jest.mock('compression', () => jest.fn(() => (req: any, res: any, next: any) => next && next()));

jest.mock('socket.io', () => {
  return { Server: jest.fn(() => ({ on: jest.fn(), emit: jest.fn(), use: jest.fn(), engine: { clientsCount: 0 } })) };
});

beforeEach(() => {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'secret';
});

test('initializeWebSocketServer returns a running instance', async () => {
  const { initializeWebSocketServer } = await import('../lib/websocket-server');
  const server = initializeWebSocketServer(1234);
  expect(server.isRunning).toBe(true);
  expect(server.port).toBe(1234);
});

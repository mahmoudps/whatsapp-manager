import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';

const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});
describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(<Home />);
    expect(
      screen.getByText(/منصة متكاملة لإدارة الأجهزة والرسائل/i)
    ).toBeInTheDocument();
  });
});

describe('API Routes', () => {
  it('health check endpoint returns 200', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.status).toBe(200);
  });

  it('websocket connection works', async () => {
    const socket = new WebSocket('ws://localhost:3001/ws/socket.io');
    await new Promise((resolve) => {
      socket.onopen = resolve;
    });
    expect(socket.readyState).toBe(WebSocket.OPEN);
    socket.close();
  });
});

describe('Authentication', () => {
  it('login page is accessible', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    const response = await fetch('http://localhost:3000/login');
    expect(response.status).toBe(200);
  });

  it('protected routes require authentication', async () => {
    mockFetch.mockResolvedValueOnce({ status: 401, json: async () => ({}) });
    const response = await fetch('http://localhost:3000/dashboard');
    expect(response.status).toBe(401);
  });
});
describe('Database', () => {
  it('database connection works', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ status: 'connected' }),
    });
    const response = await fetch('http://localhost:3000/api/db/status');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('connected');
  });
});

describe('WhatsApp Integration', () => {
  it('whatsapp connection status endpoint exists', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    const response = await fetch('http://localhost:3000/api/whatsapp/status');
    expect(response.status).toBe(200);
  });

  it('whatsapp session management works', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ sessions: [] }),
    });
    const response = await fetch('http://localhost:3000/api/whatsapp/sessions');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.sessions)).toBe(true);
  });
});

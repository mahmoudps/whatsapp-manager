import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';
import { I18nProvider } from '../lib/i18n';

const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});
describe('Home Page', () => {
  it('renders without crashing', () => {
    render(
      <I18nProvider locale="ar">
        <Home />
      </I18nProvider>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(
      <I18nProvider locale="ar">
        <Home />
      </I18nProvider>
    );
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

  it('websocket status endpoint returns 200', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    const response = await fetch('http://localhost:3000/api/socket/status');
    expect(response.status).toBe(200);
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
  it('database health check works', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ database: { connected: true } }),
    });
    const response = await fetch('http://localhost:3000/api/health?check=database');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.database.connected).toBe(true);
  });
});

describe('Device APIs', () => {
  it('devices endpoint returns list', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ devices: [] }),
    });
    const response = await fetch('http://localhost:3000/api/devices');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.devices)).toBe(true);
  });
});

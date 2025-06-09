import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

if (typeof global.Request === 'undefined') {
  global.Request = function () {};
}
if (typeof global.Response === 'undefined') {
  global.Response = function () {};
}

// Mock WebSocket
global.WebSocket = class WebSocket {
  static OPEN = 1;
  constructor() {
    this.readyState = WebSocket.OPEN;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }
  send() {}
  close() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

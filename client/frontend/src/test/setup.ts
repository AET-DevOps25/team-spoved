import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder (needed for React Router)
// Provide Jest-compatible globals using Vitest's mocking utilities
(globalThis as any).jest = vi;
(globalThis as any).jest.mock = vi.mock;

// Always stub global.fetch with a Vitest mock so tests can control its behaviour
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
(global as any).fetch = vi.fn();

// Provide mock values for Vite environment variables used in the frontend code
// This makes `import.meta.env.VITE_*` defined inside the modules under test
// Note: `import.meta` is a per-module object, but mutating the one from this
// setup file is sufficient because Vitest reuses the same reference.
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GENAI_API_URL: 'http://localhost:8000',
    VITE_TICKET_API_URL: 'http://localhost:8081/api/v1',
    VITE_USER_API_URL: 'http://localhost:8082/api/v1',
    VITE_AUTH_API_URL: 'http://localhost:8030',
    VITE_MEDIA_API_URL: 'http://localhost:8083/api/v1',
  },
  writable: true,
});

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock localStorage/sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock import.meta.env globally
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_GENAI_API_URL: 'http://localhost:8000',
        VITE_TICKET_API_URL: 'http://localhost:8081/api/v1',
        VITE_USER_API_URL: 'http://localhost:8082/api/v1',
        VITE_AUTH_API_URL: 'http://localhost:8030',
        VITE_MEDIA_API_URL: 'http://localhost:8083',
      },
    },
  },
  writable: true,
  configurable: true,
});

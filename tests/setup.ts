/**
 * Jest setup file
 * Runs before all tests
 */

import dotenv from 'dotenv';
import { createLogger } from '@/utils/logger';

// Extend globalThis with logger property
declare global {
  var logger: ReturnType<typeof createLogger>;
}

// Load environment variables
dotenv.config();

// Setup global test timeout
jest.setTimeout(60000);

// Setup global logger
globalThis.logger = createLogger('global-setup');

// Setup MSW server lifecycle (lazy load to avoid ESM issues)
let server: any;

beforeAll(async () => {
  try {
    const { server: mswServer } = await import('@/mocks/server');
    server = mswServer;
    globalThis.logger?.info('Starting MSW server for API mocking');
    server.listen({ onUnhandledRequest: 'warn' });
  } catch (error) {
    globalThis.logger?.warn(
      `Could not start MSW server: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Reset handlers after each test
afterEach(() => {
  if (server?.resetHandlers) {
    server.resetHandlers();
  }
});

// Clean up after all tests
afterAll(() => {
  if (server) {
    globalThis.logger?.info('Closing MSW server');
    server.close?.();
  }
});

// Add custom matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// Add custom matchers types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

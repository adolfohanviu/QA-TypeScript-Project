/**
 * MSW Server Setup for Tests
 * Initializes Mock Service Worker for all test suites
 */

import { beforeAll, afterEach, afterAll } from '@jest/globals';
import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Create server with handlers
export const server = setupServer(...handlers);

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});


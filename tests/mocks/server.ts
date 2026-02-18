/**
 * MSW Server Setup for Tests
 * Initializes Mock Service Worker for all test suites
 */

import { server } from './handlers.js';

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

/**
 * MSW Server Setup for Jest
 * Initializes Mock Service Worker for test environment
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Create MSW server with all handlers
 * This server intercepts all HTTP requests in Jest environment
 */
export const server = setupServer(...handlers);

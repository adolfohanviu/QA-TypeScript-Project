/**
 * Jest setup file
 * Runs before all tests
 */

import dotenv from 'dotenv';
import { LoggerFactory } from '@/utils/logger.js';

// Load environment variables
dotenv.config();

// Setup global test timeout
jest.setTimeout(60000);

// Setup global logger
globalThis.logger = LoggerFactory.getLogger('global-setup');

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

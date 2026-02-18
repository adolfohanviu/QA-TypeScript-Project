/**
 * @feature User API
 * User API test suite
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApiClient, ApiClient, ApiError } from '@/utils/api-client';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';
import type { User } from '@/types/index';

describe('@api @contract User API Tests', () => {
  let apiClient: ApiClient;
  const logger = createLogger('UserAPITests');

  beforeEach(() => {
    logger.info('Initializing API client');
    apiClient = createApiClient(config.get('apiBaseUrl'));
  });

  describe('@smoke GET /users', () => {
    it('should retrieve all users', async () => {
      // @arrange
      // @act
      const users = await apiClient.get<User[]>('/users');

      // @assert
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('username');
      logger.info(`Retrieved ${users.length} users`);
    });
  });

  describe('@regression GET /users/:id', () => {
    it('should retrieve specific user by id', async () => {
      // @arrange
      const userId = 1;

      // @act
      const user = await apiClient.get<User>(`/users/${userId}`);

      // @assert
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.username).toBeDefined();
      logger.info(`Retrieved user: ${user.username}`);
    });

    it('should return 404 for non-existent user', async () => {
      // @arrange
      const userId = 99999;

      // @act & @assert
      try {
        await apiClient.get(`/users/${userId}`);
        throw new Error('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });

  describe('@regression POST /users', () => {
    it('should create new user ', async () => {
      // @arrange
      const newUser = {
        firstName: 'Test',
        username: 'testuser',
        email: 'test@example.com',
      };

      // @act
      const createdUser = await apiClient.post<User>('/users', newUser);

      // @assert
      expect(createdUser.id).toBeDefined();
      expect(createdUser.username).toBe(newUser.username);
      logger.info(`Created user with ID: ${createdUser.id}`);
    });
  });

  describe('@contract User Response Schema', () => {
    it('should have required user fields', async () => {
      // @arrange
      // @act
      const users = await apiClient.get<User[]>('/users');
      const user = users[0];

      // @assert - Schema validation
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(typeof user.id).toBe('number');
      expect(typeof user.username).toBe('string');
      logger.info('User schema validation passed');
    });
  });
});

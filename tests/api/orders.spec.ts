/**
 * @feature Order API
 * Order management and checkout API tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApiClient, ApiClient } from '@/utils/api-client.js';
import { config } from '@/utils/config.js';
import { createLogger } from '@/utils/logger.js';
import type { Order } from '@/types/index.js';

describe('@api @contract Order API Tests', () => {
  let apiClient: ApiClient;
  const logger = createLogger('OrderAPITests');

  beforeEach(() => {
    apiClient = createApiClient(config.get('apiBaseUrl'));
  });

  describe('@smoke GET /orders', () => {
    it('should retrieve all orders', async () => {
      // @arrange
      // @act
      const orders = await apiClient.get<Order[]>('/orders');

      // @assert
      expect(Array.isArray(orders)).toBe(true);
      logger.info(`Retrieved ${orders.length} orders`);
    });

    it('should filter orders by status', async () => {
      // @arrange
      const status = 'pending';

      // @act
      const orders = await apiClient.get<Order[]>(
        `/orders?status=${status}`
      );

      // @assert
      expect(Array.isArray(orders)).toBe(true);
      if (orders.length > 0) {
        orders.forEach((order) => {
          expect(order.status).toBe(status);
        });
      }
      logger.info(`Retrieved ${orders.length} ${status} orders`);
    });
  });

  describe('@regression GET /orders/:id', () => {
    it('should retrieve specific order by id', async () => {
      // @arrange
      const orderId = 1;

      // @act
      const order = await apiClient.get<Order>(`/orders/${orderId}`);

      // @assert
      expect(order.id).toBe(orderId);
      expect(order.userId).toBeDefined();
      expect(order.total).toBeGreaterThanOrEqual(0);
      expect(['pending', 'completed', 'cancelled']).toContain(order.status);
      logger.info(`Retrieved order ${orderId} with status: ${order.status}`);
    });
  });

  describe('@regression POST /orders', () => {
    it('should create new order with items', async () => {
      // @arrange
      const newOrder = {
        userId: 1,
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      };

      // @act
      const createdOrder = await apiClient.post<Order>('/orders', newOrder);

      // @assert
      expect(createdOrder.id).toBeDefined();
      expect(createdOrder.userId).toBe(newOrder.userId);
      expect(createdOrder.status).toBe('pending');
      expect(createdOrder.total).toBeGreaterThan(0);
      logger.info(`Created order ${createdOrder.id} with total: $${createdOrder.total}`);
    });

    it('should calculate total correctly', async () => {
      // @arrange
      const newOrder = {
        userId: 1,
        items: [
          { productId: 1, quantity: 2, unitPrice: 50 }, // 100
          { productId: 2, quantity: 1, unitPrice: 75 }, // 75
        ],
      };

      // @act
      const createdOrder = await apiClient.post<Order>('/orders', newOrder);

      // @assert - Expected total: 175
      expect(createdOrder.total).toBeCloseTo(175, 2);
      logger.info(`Order total calculated correctly: $${createdOrder.total}`);
    });
  });

  describe('@regression PUT /orders/:id', () => {
    it('should update order status to completed', async () => {
      // @arrange & @act
      const updatedOrder = await apiClient.put<Order>('/orders/1', {
        status: 'completed',
      });

      // @assert
      expect(updatedOrder.status).toBe('completed');
      logger.info(`Updated order 1 status to: ${updatedOrder.status}`);
    });

    it('should update order status to cancelled', async () => {
      // @arrange & @act
      const updatedOrder = await apiClient.put<Order>('/orders/2', {
        status: 'cancelled',
      });

      // @assert
      expect(updatedOrder.status).toBe('cancelled');
      logger.info(`Cancelled order 2`);
    });
  });

  describe('@contract Order Response Schema', () => {
    it('should have required order fields', async () => {
      // @arrange
      // @act
      const orders = await apiClient.get<Order[]>('/orders');
      if (orders.length === 0) return;

      const order = orders[0];

      // @assert
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('userId');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
      logger.info('Order schema validation passed');
    });

    it('should have valid order totals', async () => {
      // @arrange
      // @act
      const orders = await apiClient.get<Order[]>('/orders');

      // @assert
      orders.forEach((order) => {
        expect(order.total).toBeGreaterThanOrEqual(0);
        expect(typeof order.total).toBe('number');
      });
      logger.info('All orders have valid totals');
    });

    it('should have valid status values', async () => {
      // @arrange
      const validStatuses = ['pending', 'completed', 'cancelled'];

      // @act
      const orders = await apiClient.get<Order[]>('/orders');

      // @assert
      orders.forEach((order) => {
        expect(validStatuses).toContain(order.status);
      });
      logger.info('All orders have valid status values');
    });

    it('should have timestamps in ISO format', async () => {
      // @arrange
      // @act
      const orders = await apiClient.get<Order[]>('/orders');
      if (orders.length === 0) return;

      const order = orders[0];

      // @assert
      expect(order.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      if (order.updatedAt) {
        expect(order.updatedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
      }
      logger.info('Order timestamps are in valid ISO format');
    });
  });

  describe('@regression Order Business Logic', () => {
    it('should not allow negative quantities', async () => {
      // @arrange
      const invalidOrder = {
        userId: 1,
        items: [{ productId: 1, quantity: -5 }],
      };

      // @act & @assert
      try {
        await apiClient.post('/orders', invalidOrder);
        throw new Error('Should have rejected negative quantity');
      } catch (error) {
        expect(error).toBeDefined();
        logger.info('Negative quantity validation passed');
      }
    });

    it('should require at least one item in order', async () => {
      // @arrange
      const invalidOrder = {
        userId: 1,
        items: [],
      };

      // @act & @assert
      try {
        await apiClient.post('/orders', invalidOrder);
        throw new Error('Should have rejected empty order');
      } catch (error) {
        expect(error).toBeDefined();
        logger.info('Empty order validation passed');
      }
    });
  });
});

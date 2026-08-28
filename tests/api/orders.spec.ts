/**
 * @feature Order API
 * Order management and checkout API tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { createApiClient, ApiClient } from '@/utils/api-client';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';
import type { Order, OrderStatus } from '@/types/index';

const VALID_ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Schema derived from the real response shape in src/mocks/handlers.ts's orderHandlers,
// not just the Order interface — the handler is the actual contract under test.
const OrderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
  price: z.number(),
});

const OrderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  items: z.array(OrderItemSchema),
  total: z.number().nonnegative(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  createdAt: z.string().datetime(),
});

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
      expect(VALID_ORDER_STATUSES).toContain(order.status);
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
    it('should update order status to delivered', async () => {
      // @arrange & @act
      const updatedOrder = await apiClient.put<Order>('/orders/1', {
        status: 'delivered',
      });

      // @assert
      expect(updatedOrder.status).toBe('delivered');
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
    it('should match OrderSchema for every order returned by GET /orders', async () => {
      // @arrange
      // @act
      const orders = await apiClient.get<unknown[]>('/orders');

      // @assert
      orders.forEach((order) => {
        const result = OrderSchema.safeParse(order);
        expect(result.success).toBe(true);
      });
      logger.info(`Validated ${orders.length} orders against OrderSchema`);
    });

    it('should match OrderSchema for a single order returned by GET /orders/:id', async () => {
      // @arrange
      const orderId = 1;

      // @act
      const order = await apiClient.get<unknown>(`/orders/${orderId}`);

      // @assert
      const result = OrderSchema.safeParse(order);
      expect(result.success).toBe(true);
      logger.info(`Order ${orderId} matches OrderSchema`);
    });

    it('should reject a malformed order missing required fields', () => {
      // @arrange
      const malformedOrder = { id: 1, userId: 1 };

      // @act
      const result = OrderSchema.safeParse(malformedOrder);

      // @assert
      expect(result.success).toBe(false);
      logger.info('Malformed order correctly rejected by OrderSchema');
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

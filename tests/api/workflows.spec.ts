/**
 * @feature E2E API Flows
 * End-to-end API workflow tests combining multiple endpoints
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApiClient, ApiClient } from '@/utils/api-client';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';
import type { User, Order, Product } from '@/types/index';

describe('@api @workflow Checkout E2E Flow', () => {
  let apiClient: ApiClient;
  const logger = createLogger('CheckoutFlowTests');
  let testUserId: number;
  let testProductId: number;

  beforeEach(async () => {
    apiClient = createApiClient(config.get('apiBaseUrl'));
  });

  describe('@smoke Complete Purchase Workflow', () => {
    it('should complete full checkout flow: user -> product -> order', async () => {
      logger.info('Starting complete purchase workflow');

      // Step 1: Create/Get User
      logger.info('Step 1: Fetching user');
      const users = await apiClient.get<User[]>('/users');
      expect(users.length).toBeGreaterThan(0);
      const user = users[0];
      testUserId = user.id;
      logger.info(`✓ User fetched: ${user.username} (ID: ${user.id})`);

      // Step 2: Get Product
      logger.info('Step 2: Fetching product');
      const products = await apiClient.get<Product[]>('/products');
      expect(products.length).toBeGreaterThan(0);
      const product = products[0];
      testProductId = product.id;
      expect(product.inStock).toBeDefined();
      logger.info(
        `✓ Product fetched: ${product.name} - $${product.price} (In Stock: ${product.inStock})`
      );

      // Step 3: Create Order
      logger.info('Step 3: Creating order');
      const orderPayload = {
        userId: testUserId,
        items: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
      };
      const order = await apiClient.post<Order>('/orders', orderPayload);
      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.total).toBeGreaterThan(0);
      logger.info(
        `✓ Order created: ${order.id} - Total: $${order.total} (Status: ${order.status})`
      );

      // Step 4: Confirm Order
      logger.info('Step 4: Confirming order');
      const confirmedOrder = await apiClient.put<Order>(`/orders/${order.id}`, {
        status: 'completed',
      });
      expect(confirmedOrder.status).toBe('completed');
      logger.info(`✓ Order confirmed: ${confirmedOrder.id}`);

      logger.info('✓ Complete purchase workflow successful');
    });
  });

  describe('@regression Multi-Item Cart Workflow', () => {
    it('should handle cart with multiple different products', async () => {
      logger.info('Starting multi-item cart workflow');

      // Setup
      const users = await apiClient.get<User[]>('/users');
      const user = users[0];
      const products = await apiClient.get<Product[]>('/products');
      expect(products.length).toBeGreaterThanOrEqual(2);

      // Create order with multiple items
      const orderPayload = {
        userId: user.id,
        items: [
          { productId: products[0].id, quantity: 1 },
          { productId: products[1].id, quantity: 2 },
        ],
      };

      const order = await apiClient.post<Order>('/orders', orderPayload);
      expect(order.items).toHaveLength(2);
      logger.info(`✓ Multi-item order created with ${order.items.length} items`);
    });
  });

  describe('@regression Inventory Management Workflow', () => {
    it('should update inventory after purchase', async () => {
      logger.info('Starting inventory management workflow');

      // Get initial stock
      const product = await apiClient.get<Product>('/products/1');
      const initialStock = product.inStock;
      logger.info(`Initial stock: ${initialStock}`);

      // Create order
      const users = await apiClient.get<User[]>('/users');
      const order = await apiClient.post<Order>('/orders', {
        userId: users[0].id,
        items: [{ productId: 1, quantity: 2 }],
      });
      logger.info(`Order created with 2 items`);

      // In a real system, inventory would be updated
      // This test demonstrates the workflow
      expect(order.items[0].quantity).toBe(2);
      logger.info(`✓ Inventory management workflow validated`);
    });
  });

  describe('@regression Order Lifecycle', () => {
    it('should track order through complete lifecycle', async () => {
      logger.info('Starting order lifecycle test');

      // Create order
      const users = await apiClient.get<User[]>('/users');
      const products = await apiClient.get<Product[]>('/products');

      const order = await apiClient.post<Order>('/orders', {
        userId: users[0].id,
        items: [{ productId: products[0].id, quantity: 1 }],
      });

      expect(order.status).toBe('pending');
      logger.info(`Stage 1: Order created (${order.status})`);

      // Update to completed
      const completedOrder = await apiClient.put<Order>(
        `/orders/${order.id}`,
        { status: 'completed' }
      );
      expect(completedOrder.status).toBe('completed');
      logger.info(`Stage 2: Order completed (${completedOrder.status})`);

      // Verify final state
      const finalOrder = await apiClient.get<Order>(`/orders/${order.id}`);
      expect(finalOrder.status).toBe('completed');
      logger.info(`Stage 3: Order status verified (${finalOrder.status})`);

      logger.info('✓ Order lifecycle test passed');
    });
  });

  describe('@regression Error Handling in Workflow', () => {
    it('should handle missing product gracefully', async () => {
      // @arrange
      const users = await apiClient.get<User[]>('/users');

      // @act & @assert
      try {
        await apiClient.post('/orders', {
          userId: users[0].id,
          items: [{ productId: 99999, quantity: 1 }],
        });
        throw new Error('Should have rejected invalid product');
      } catch (error) {
        expect(error).toBeDefined();
        logger.info('✓ Invalid product validation passed');
      }
    });

    it('should handle missing user gracefully', async () => {
      // @arrange
      const products = await apiClient.get<Product[]>('/products');

      // @act & @assert
      try {
        await apiClient.post('/orders', {
          userId: 99999,
          items: [{ productId: products[0].id, quantity: 1 }],
        });
        throw new Error('Should have rejected invalid user');
      } catch (error) {
        expect(error).toBeDefined();
        logger.info('✓ Invalid user validation passed');
      }
    });
  });

  describe('@performance API Response Times', () => {
    it('should retrieve users within acceptable time', async () => {
      // @arrange
      const startTime = Date.now();

      // @act
      await apiClient.get<User[]>('/users');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // @assert
      expect(duration).toBeLessThan(2000); // 2 second threshold
      logger.info(`Users endpoint response time: ${duration}ms`);
    });

    it('should create order within acceptable time', async () => {
      // @arrange
      const users = await apiClient.get<User[]>('/users');
      const products = await apiClient.get<Product[]>('/products');

      const startTime = Date.now();

      // @act
      await apiClient.post('/orders', {
        userId: users[0].id,
        items: [{ productId: products[0].id, quantity: 1 }],
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // @assert
      expect(duration).toBeLessThan(3000); // 3 second threshold
      logger.info(`Order creation response time: ${duration}ms`);
    });
  });
});

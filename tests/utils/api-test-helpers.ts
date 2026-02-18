/**
 * API Test Utilities
 * Helper functions for API testing
 */

import { createApiClient, ApiClient } from '@/utils/api-client.js';
import { config } from '@/utils/config.js';
import type { User, Product, Order } from '@/types/index.js';

/**
 * API Test Context
 * Provides convenient access to API client and common operations
 */
export class ApiTestContext {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = createApiClient(config.get('apiBaseUrl'));
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return this.apiClient.get<User[]>('/users');
  }

  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<User> {
    return this.apiClient.get<User>(`/users/${id}`);
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<User>): Promise<User> {
    return this.apiClient.post<User>('/users', userData);
  }

  /**
   * Get all products
   */
  async getProducts(limit?: number): Promise<Product[]> {
    const url = limit ? `/products?limit=${limit}` : '/products';
    return this.apiClient.get<Product[]>(url);
  }

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<Product> {
    return this.apiClient.get<Product>(`/products/${id}`);
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.apiClient.get<Product[]>(
      `/products/search?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Update product
   */
  async updateProduct(
    id: number,
    updates: Partial<Product>
  ): Promise<Product> {
    return this.apiClient.patch<Product>(`/products/${id}`, updates);
  }

  /**
   * Get all orders
   */
  async getOrders(status?: string): Promise<Order[]> {
    const url = status ? `/orders?status=${status}` : '/orders';
    return this.apiClient.get<Order[]>(url);
  }

  /**
   * Get order by ID
   */
  async getOrder(id: number): Promise<Order> {
    return this.apiClient.get<Order>(`/orders/${id}`);
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return this.apiClient.post<Order>('/orders', orderData);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.apiClient.put<Order>(`/orders/${id}`, { status });
  }

  /**
   * Complete a checkout flow
   */
  async completeCheckout(userId: number, cartItems: any[]): Promise<Order> {
    return this.createOrder({
      userId,
      items: cartItems,
    });
  }
}

/**
 * Assert functions for API testing
 */
export class ApiAssertions {
  /**
   * Assert user has required fields
   */
  static assertValidUser(user: User): void {
    if (!user.id) throw new Error('User must have an id');
    if (!user.username) throw new Error('User must have a username');
    if (!user.email) throw new Error('User must have an email');
  }

  /**
   * Assert product has required fields and valid values
   */
  static assertValidProduct(product: Product): void {
    if (!product.id) throw new Error('Product must have an id');
    if (!product.title) throw new Error('Product must have a title');
    if (product.price <= 0) throw new Error('Product price must be positive');
    if (product.stock < 0) throw new Error('Product stock cannot be negative');
  }

  /**
   * Assert order has required fields and valid values
   */
  static assertValidOrder(order: Order): void {
    if (!order.id) throw new Error('Order must have an id');
    if (!order.userId) throw new Error('Order must have a userId');
    if (!order.items || order.items.length === 0) {
      throw new Error('Order must have at least one item');
    }
    if (order.total < 0) throw new Error('Order total cannot be negative');
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(order.status)) {
      throw new Error(`Order status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Assert paginated response structure
   */
  static assertValidPaginatedResponse(data: any): void {
    if (!data) throw new Error('Response data is required');
    if (!Array.isArray(data.items)) throw new Error('items must be an array');
    if (typeof data.total !== 'number') throw new Error('total must be a number');
    if (typeof data.page !== 'number') throw new Error('page must be a number');
  }
}

/**
 * Create API test context
 */
export function createTestContext(): ApiTestContext {
  return new ApiTestContext();
}

/**
 * Wait for async condition
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Condition not met within timeout');
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(
    `Operation failed after ${maxAttempts} attempts: ${lastError?.message}`
  );
}

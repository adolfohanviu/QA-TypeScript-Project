/**
 * @feature Product API
 * Product inventory and catalog API tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApiClient, ApiClient } from '@/utils/api-client.js';
import { config } from '@/utils/config.js';
import { createLogger } from '@/utils/logger.js';
import type { Product } from '@/types/index.js';

describe('@api @contract Product API Tests', () => {
  let apiClient: ApiClient;
  const logger = createLogger('ProductAPITests');

  beforeEach(() => {
    apiClient = createApiClient(config.get('apiBaseUrl'));
  });

  describe('@smoke GET /products', () => {
    it('should retrieve all products', async () => {
      // @arrange
      // @act
      const products = await apiClient.get<Product[]>('/products');

      // @assert
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      logger.info(`Retrieved ${products.length} products`);
    });

    it('should support pagination query parameter', async () => {
      // @arrange
      const limit = 5;

      // @act
      const products = await apiClient.get<Product[]>(`/products?limit=${limit}`);

      // @assert
      expect(products.length).toBeLessThanOrEqual(limit);
      logger.info(`Retrieved ${products.length} products with limit=${limit}`);
    });
  });

  describe('@regression GET /products/:id', () => {
    it('should retrieve specific product by id', async () => {
      // @arrange
      const productId = 1;

      // @act
      const product = await apiClient.get<Product>(`/products/${productId}`);

      // @assert
      expect(product.id).toBe(productId);
      expect(product.title).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      logger.info(`Retrieved product: ${product.title}`);
    });
  });

  describe('@regression PATCH /products/:id', () => {
    it('should update product price', async () => {
      // @arrange & @act
      const updatedProduct = await apiClient.patch<Product>('/products/1', {
        price: 99.99,
      });

      // @assert
      expect(updatedProduct.price).toBe(99.99);
      logger.info(`Updated product price to ${updatedProduct.price}`);
    });

    it('should update product stock', async () => {
      // @arrange & @act
      const updatedProduct = await apiClient.patch<Product>('/products/1', {
        stock: 50,
      });

      // @assert
      expect(updatedProduct.stock).toBe(50);
      logger.info(`Updated product stock to ${updatedProduct.stock}`);
    });
  });

  describe('@contract Product Response Schema', () => {
    it('should have required product fields', async () => {
      // @arrange
      // @act
      const products = await apiClient.get<Product[]>('/products');
      const product = products[0];

      // @assert
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stock');
      expect(typeof product.id).toBe('number');
      expect(typeof product.title).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.stock).toBe('number');
      logger.info('Product schema validation passed');
    });

    it('should have valid price range', async () => {
      // @arrange
      // @act
      const products = await apiClient.get<Product[]>('/products');

      // @assert
      products.forEach((product) => {
        expect(product.price).toBeGreaterThan(0);
        expect(product.price).toBeLessThan(10000); // Reasonable upper limit
      });
      logger.info('All products have valid price ranges');
    });

    it('should have non-negative stock', async () => {
      // @arrange
      // @act
      const products = await apiClient.get<Product[]>('/products');

      // @assert
      products.forEach((product) => {
        expect(product.stock).toBeGreaterThanOrEqual(0);
      });
      logger.info('All products have non-negative stock');
    });
  });

  describe('@regression Product Search', () => {
    it('should search products by title', async () => {
      // @arrange
      const searchTerm = 'laptop';

      // @act
      const products = await apiClient.get<Product[]>(
        `/products/search?q=${searchTerm}`
      );

      // @assert
      expect(Array.isArray(products)).toBe(true);
      if (products.length > 0) {
        products.forEach((product) => {
          expect(
            product.title.toLowerCase().includes(searchTerm.toLowerCase())
          ).toBe(true);
        });
      }
      logger.info(`Found ${products.length} products matching "${searchTerm}"`);
    });
  });
});

/**
 * @feature Product API
 * Product inventory and catalog API tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createApiClient, ApiClient } from '@/utils/api-client';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';
import type { Product } from '@/types/index';

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
      expect(product.name).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.inStock).toBeDefined();
      logger.info(`Retrieved product: ${product.name}`);
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

    it('should update product availability', async () => {
      // @arrange & @act
      const updatedProduct = await apiClient.patch<Product>('/products/1', {
        inStock: true,
      });

      // @assert
      expect(updatedProduct.inStock).toBe(true);
      logger.info(`Updated product availability to ${updatedProduct.inStock}`);
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
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('inStock');
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.inStock).toBe('boolean');
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
        expect(product.inStock).toBeDefined();
      });
      logger.info('All products have availability status');
    });
  });

  describe('@regression Product Search', () => {
    it('should search products by name', async () => {
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
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).toBe(true);
        });
      }
      logger.info(`Found ${products.length} products matching "${searchTerm}"`);
    });
  });
});

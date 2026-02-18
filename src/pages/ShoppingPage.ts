/**
 * Shopping Page Object
 * Handles interactions with the shopping/products page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export class ShoppingPage extends BasePage {
  private readonly productList: Locator;
  private readonly productItems: (index: number) => Locator;
  private readonly filterButton: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.productList = page.locator('[data-testid="product-list"]');
    this.productItems = (index: number) => page.locator(`[data-testid="product-item"]:nth-child(${index})`);
    this.filterButton = page.locator('[data-testid="filter-button"]');
    this.searchInput = page.locator('[data-testid="search-products"]');
  }

  /**
   * Navigate to shopping page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to shopping page');
    await this.goto('https://example.com/products');
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    this.logger.info('Fetching products');
    await this.productList.waitFor({ state: 'visible' });
    const count = await this.page.locator('[data-testid="product-item"]').count();
    
    const products: Product[] = [];
    for (let i = 1; i <= count; i++) {
      const item = this.productItems(i);
      const id = await item.getAttribute('data-product-id') || `product-${i}`;
      const name = await item.locator('[data-testid="product-name"]').textContent();
      const priceText = await item.locator('[data-testid="product-price"]').textContent();
      const price = parseFloat(priceText?.replace('$', '') || '0');
      
      products.push({
        id,
        name: name || '',
        price,
      });
    }
    
    return products;
  }

  /**
   * Add product to cart by name and quantity
   */
  async addProductToCart(productName: string, quantity: number = 1): Promise<void> {
    this.logger.info(`Adding ${quantity} of product "${productName}" to cart`);
    
    // Find product by name
    const productItem = this.page.locator('[data-testid="product-item"]', { 
      has: this.page.locator('[data-testid="product-name"]', { hasText: productName }) 
    });
    
    // Click add to cart for this product
    await productItem.locator('[data-testid="add-to-cart-btn"]').click();
    
    // Handle quantity if needed
    if (quantity > 1) {
      const quantityInput = productItem.locator('[data-testid="quantity-input"]');
      await quantityInput.fill(quantity.toString());
    }
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Search for products
   */
  async searchProduct(query: string): Promise<void> {
    this.logger.info(`Searching for products: ${query}`);
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.productList.waitFor({ state: 'visible' });
  }

  /**
   * Filter products by category
   */
  async filterByCategory(category: string): Promise<void> {
    this.logger.info(`Filtering by category: ${category}`);
    await this.filterButton.click();
    await this.page.locator(`[data-testid="category-${category}"]`).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get product by name
   */
  async getProductByName(name: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.name === name) || null;
  }

  /**
   * Sort products
   */
  async sortBy(sortOption: 'price-low' | 'price-high' | 'name' | 'newest'): Promise<void> {
    this.logger.info(`Sorting by: ${sortOption}`);
    await this.page.locator('[data-testid="sort-button"]').click();
    await this.page.locator(`[data-testid="sort-${sortOption}"]`).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Sort products (alternative naming)
   */
  async sortProducts(sortOption: string): Promise<void> {
    this.logger.info(`Sorting by: ${sortOption}`);
    const sortMap: Record<string, string> = {
      'price-low-to-high': 'price-low',
      'price-high-to-low': 'price-high',
      'name-a-z': 'name',
      'newest-first': 'newest',
    };
    const mappedOption = sortMap[sortOption] || sortOption;
    
    await this.page.locator('[data-testid="sort-button"]').click();
    await this.page.locator(`[data-testid="sort-${mappedOption}"]`).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get cart count indicator
   */
  async getCartCount(): Promise<number> {
    const cartBadge = this.page.locator('[data-testid="cart-badge"]');
    const count = await cartBadge.textContent();
    return parseInt(count || '0', 10);
  }

  /**
   * Get all product names displayed on page
   */
  async getAllProductNames(): Promise<string[]> {
    this.logger.info('Getting all product names');
    await this.productList.waitFor({ state: 'visible' });
    const productNames: string[] = [];
    const items = await this.page.locator('[data-testid="product-name"]').all();
    
    for (const item of items) {
      const name = await item.textContent();
      if (name) {
        productNames.push(name.trim());
      }
    }
    
    return productNames;
  }

  /**
   * Get product count on page
   */
  async getProductCount(): Promise<number> {
    const count = await this.page.locator('[data-testid="product-item"]').count();
    return count;
  }

  /**
   * Check if product has discount
   */
  async hasDiscount(productName: string): Promise<boolean> {
    const product = this.page.locator('[data-testid="product-item"]', {
      has: this.page.locator('[data-testid="product-name"]', { hasText: productName })
    });
    
    const discountBadge = product.locator('[data-testid="discount-badge"]');
    return await discountBadge.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get product price
   */
  async getProductPrice(productName: string): Promise<number> {
    const product = this.page.locator('[data-testid="product-item"]', {
      has: this.page.locator('[data-testid="product-name"]', { hasText: productName })
    });
    
    const priceText = await product.locator('[data-testid="product-price"]').textContent();
    return parseFloat(priceText?.replace('$', '') || '0');
  }
}


/**
 * Products Page Object
 * Handles product inventory and shopping workflows
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ProductsPage extends BasePage {
  private readonly selectors = {
    inventoryItems: '.inventory_list .inventory_item',
    productName: '.inventory_item_name',
    productPrice: '.inventory_item_price',
    shoppingCart: '[data-test="shopping-cart-link"]',
    cartBadge: '[data-test="shopping-cart-badge"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@products');
  }

  /**
   * Build the real per-product data-test slug from its displayed name
   * e.g. "Sauce Labs Bike Light" -> "sauce-labs-bike-light"
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Wait for products to load
   */
  async waitForProductsToLoad(): Promise<void> {
    await this.waitForElement(this.selectors.inventoryItems);
  }

  /**
   * Get number of products displayed
   */
  async getProductCount(): Promise<number> {
    return await this.page.locator(this.selectors.inventoryItems).count();
  }

  /**
   * Add product to cart by index
   */
  async addProductToCart(index: number): Promise<void> {
    const items = this.page.locator(this.selectors.inventoryItems);
    const count = await items.count();
    if (index >= count) {
      throw new Error(`Product at index ${index} not found`);
    }
    const name = await items.nth(index).locator(this.selectors.productName).textContent();
    if (!name) {
      throw new Error(`Product at index ${index} has no name`);
    }
    this.logger.info(`Adding product at index ${index} to cart`);
    await this.click(`[data-test="add-to-cart-${this.slugify(name)}"]`);
  }

  /**
   * Add product to cart by name
   */
  async addProductToCartByName(productName: string): Promise<void> {
    const slug = this.slugify(productName);
    const selector = `[data-test="add-to-cart-${slug}"]`;

    if (!(await this.elementExists(selector))) {
      throw new Error(`Product '${productName}' not found`);
    }

    this.logger.info(`Adding product '${productName}' to cart`);
    await this.click(selector);
  }

  /**
   * Get all product names
   */
  async getProductNames(): Promise<string[]> {
    const names = await this.page.locator(this.selectors.productName).allTextContents();
    return names.map(name => name.trim());
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    if (!(await this.isVisible(this.selectors.cartBadge))) {
      return 0;
    }
    const count = await this.getText(this.selectors.cartBadge);
    return parseInt(count, 10);
  }

  /**
   * Open shopping cart
   */
  async openCart(): Promise<void> {
    this.logger.info('Opening shopping cart');
    await this.click(this.selectors.shoppingCart);
  }

  /**
   * Check if product is in cart
   */
  async isProductInCart(): Promise<boolean> {
    const cartCount = await this.getCartItemCount();
    return cartCount > 0;
  }
}

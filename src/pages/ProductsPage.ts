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
    addToCartButton: '[data-test="add-to-cart-button"]',
    removeButton: '[data-test="remove-button"]',
    shoppingCart: '.shopping_cart_link',
    cartBadge: '.shopping_cart_badge',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@products');
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
    const items = await this.page.$$(this.selectors.inventoryItems);
    return items.length;
  }

  /**
   * Add product to cart by index
   */
  async addProductToCart(index: number): Promise<void> {
    const buttons = await this.page.$$(this.selectors.addToCartButton);
    if (index >= buttons.length) {
      throw new Error(`Product at index ${index} not found`);
    }
    this.logger.info(`Adding product at index ${index} to cart`);
    await buttons[index].click();
  }

  /**
   * Add product to cart by name
   */
  async addProductToCartByName(productName: string): Promise<void> {
    const products = await this.page.$$(this.selectors.inventoryItems);

    for (const product of products) {
      const name = await product.$eval(this.selectors.productName, el => el.textContent);
      if (name === productName) {
        const button = await product.$(this.selectors.addToCartButton);
        if (button) {
          this.logger.info(`Adding product '${productName}' to cart`);
          await button.click();
          return;
        }
      }
    }

    throw new Error(`Product '${productName}' not found`);
  }

  /**
   * Get all product names
   */
  async getProductNames(): Promise<string[]> {
    return await this.page.$$eval(this.selectors.productName, elements =>
      elements.map(el => el.textContent || ''),
    );
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

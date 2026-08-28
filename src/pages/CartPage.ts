/**
 * Cart Page Object
 * Handles interactions with the shopping cart
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CartItem {
  name: string;
  description: string;
  price: number;
}

export class CartPage extends BasePage {
  private readonly selectors = {
    cartItems: '[data-test="inventory-item"]',
    itemName: '.inventory_item_name',
    itemDescription: '.inventory_item_desc',
    itemPrice: '.inventory_item_price',
    checkoutButton: '[data-test="checkout"]',
    continueShoppingButton: '[data-test="continue-shopping"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@cart');
  }

  /**
   * Build the real per-product remove selector from its displayed name
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Navigate to cart page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to cart page');
    await this.goto('https://www.saucedemo.com/cart.html');
  }

  /**
   * Get all cart items
   */
  async getCartItems(): Promise<CartItem[]> {
    this.logger.info('Fetching cart items');

    const items = this.page.locator(this.selectors.cartItems);
    const count = await items.count();

    const cartItems: CartItem[] = [];
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const name = (await item.locator(this.selectors.itemName).textContent()) || '';
      const description = (await item.locator(this.selectors.itemDescription).textContent()) || '';
      const priceText = (await item.locator(this.selectors.itemPrice).textContent()) || '0';

      cartItems.push({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(priceText.replace('$', '')),
      });
    }

    return cartItems;
  }

  /**
   * Get total count of items in cart
   */
  async getItemCount(): Promise<number> {
    return await this.page.locator(this.selectors.cartItems).count();
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    return (await this.getItemCount()) === 0;
  }

  /**
   * Remove item from cart by product name
   */
  async removeItem(productName: string): Promise<void> {
    this.logger.info(`Removing item from cart: ${productName}`);
    const slug = this.slugify(productName);
    await this.click(`[data-test="remove-${slug}"]`);
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    this.logger.info('Proceeding to checkout');
    await this.click(this.selectors.checkoutButton);
    await this.page.waitForURL('**/checkout-step-one.html');
  }

  /**
   * Continue shopping (back to inventory page)
   */
  async continueShopping(): Promise<void> {
    this.logger.info('Continuing shopping');
    await this.click(this.selectors.continueShoppingButton);
    await this.page.waitForURL('**/inventory.html');
  }
}

/**
 * Cart Page Object Model
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { createLogger } from '@/utils/logger.js';

export interface CartItemDetails {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export class CartPage extends BasePage {
  // Locators
  private readonly cartItems: Locator;
  private readonly emptyCartMessage: Locator;
  private readonly subtotalAmount: Locator;
  private readonly taxAmount: Locator;
  private readonly totalAmount: Locator;
  private readonly checkoutButton: Locator;
  private readonly continueShopping: Locator;
  private readonly removeButton: Locator;
  private readonly quantityInput: Locator;
  private readonly applyCoupon: Locator;

  private logger = createLogger('CartPage');

  constructor(page: Page) {
    super(page);
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
    this.subtotalAmount = page.locator('[data-testid="subtotal"]');
    this.taxAmount = page.locator('[data-testid="tax"]');
    this.totalAmount = page.locator('[data-testid="total"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShopping = page.locator('[data-testid="continue-shopping"]');
    this.removeButton = page.locator('[data-testid="remove-item"]');
    this.quantityInput = page.locator('[data-testid="quantity-input"]');
    this.applyCoupon = page.locator('[data-testid="apply-coupon"]');
  }

  /**
   * Navigate to cart
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to cart page');
    await this.page.goto('/cart');
    await this.waitForElement(this.page.locator('[data-testid="cart-page"]'));
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    const isEmpty = await this.emptyCartMessage.isVisible();
    this.logger.info(`Cart is empty: ${isEmpty}`);
    return isEmpty;
  }

  /**
   * Get number of items in cart
   */
  async getItemCount(): Promise<number> {
    if (await this.isCartEmpty()) {
      return 0;
    }
    const count = await this.cartItems.count();
    this.logger.info(`Cart has ${count} items`);
    return count;
  }

  /**
   * Get all cart items with details
   */
  async getAllItems(): Promise<CartItemDetails[]> {
    const count = await this.getItemCount();
    if (count === 0) return [];

    const items: CartItemDetails[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);
      const name = await item
        .locator('[data-testid="item-name"]')
        .textContent();
      const quantityText = await item
        .locator('[data-testid="item-quantity"]')
        .inputValue();
      const priceText = await item
        .locator('[data-testid="item-price"]')
        .textContent();
      const subtotalText = await item
        .locator('[data-testid="item-subtotal"]')
        .textContent();

      items.push({
        name: name?.trim() || '',
        quantity: parseInt(quantityText || '0'),
        price: parseFloat(priceText?.replace('$', '') || '0'),
        subtotal: parseFloat(subtotalText?.replace('$', '') || '0'),
      });
    }

    this.logger.info(`Retrieved ${items.length} cart items`);
    return items;
  }

  /**
   * Update item quantity
   */
  async updateQuantity(itemName: string, newQuantity: number): Promise<void> {
    this.logger.info(`Updating "${itemName}" quantity to ${newQuantity}`);
    const item = this.cartItems.filter({ has: this.page.locator('text=' + itemName) }).first();
    await item.locator('[data-testid="quantity-input"]').fill(newQuantity.toString());
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemName: string): Promise<void> {
    this.logger.info(`Removing "${itemName}" from cart`);
    const item = this.cartItems.filter({ has: this.page.locator('text=' + itemName) }).first();
    await item.locator('[data-testid="remove-item"]').click();
    await this.waitForToast('Removed from cart');
  }

  /**
   * Get subtotal amount
   */
  async getSubtotal(): Promise<number> {
    const text = await this.subtotalAmount.textContent();
    const amount = parseFloat(text?.replace('$', '') || '0');
    this.logger.info(`Subtotal: $${amount}`);
    return amount;
  }

  /**
   * Get tax amount
   */
  async getTax(): Promise<number> {
    const text = await this.taxAmount.textContent();
    const amount = parseFloat(text?.replace('$', '') || '0');
    this.logger.info(`Tax: $${amount}`);
    return amount;
  }

  /**
   * Get total amount
   */
  async getTotal(): Promise<number> {
    const text = await this.totalAmount.textContent();
    const amount = parseFloat(text?.replace('$', '') || '0');
    this.logger.info(`Total: $${amount}`);
    return amount;
  }

  /**
   * Verify price calculation
   */
  async verifyPriceCalculation(): Promise<boolean> {
    const subtotal = await this.getSubtotal();
    const tax = await this.getTax();
    const total = await this.getTotal();

    const expected = Math.round((subtotal + tax) * 100) / 100;
    const actual = Math.round(total * 100) / 100;

    const isCorrect = expected === actual;
    this.logger.info(`Price calculation verified: ${isCorrect}`);
    return isCorrect;
  }

  /**
   * Apply coupon code
   */
  async applyCouponCode(code: string): Promise<void> {
    this.logger.info(`Applying coupon: ${code}`);
    await this.page.locator('[data-testid="coupon-input"]').fill(code);
    await this.applyCoupon.click();
    await this.waitForToast('Coupon applied');
  }

  /**
   * Click checkout button
   */
  async clickCheckout(): Promise<void> {
    this.logger.info('Clicking checkout button');
    await this.checkoutButton.click();
  }

  /**
   * Click continue shopping
   */
  async clickContinueShopping(): Promise<void> {
    this.logger.info('Clicking continue shopping');
    await this.continueShopping.click();
  }

  /**
   * Verify cart contains item
   */
  async containsItem(itemName: string): Promise<boolean> {
    const items = await this.getAllItems();
    const found = items.some((item) => item.name.includes(itemName));
    this.logger.info(`Cart contains "${itemName}": ${found}`);
    return found;
  }

  /**
   * Clear cart (remove all items)
   */
  async clearCart(): Promise<void> {
    this.logger.info('Clearing cart');
    while (!(await this.isCartEmpty())) {
      const items = await this.getAllItems();
      if (items.length > 0) {
        await this.removeItem(items[0].name);
      }
    }
    this.logger.info('Cart cleared');
  }

  /**
   * Get discount amount if applied
   */
  async getDiscountAmount(): Promise<number> {
    const discount = this.page.locator('[data-testid="discount"]');
    if (!(await discount.isVisible())) {
      return 0;
    }
    const text = await discount.textContent();
    const amount = parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
    this.logger.info(`Discount: $${amount}`);
    return amount;
  }
}

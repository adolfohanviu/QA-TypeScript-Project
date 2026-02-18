/**
 * Cart Page Object
 * Handles interactions with the shopping cart
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export class CartPage extends BasePage {
  private readonly cartItems: Locator;
  private readonly checkoutButton: Locator;
  private readonly emptyCartMessage: Locator;
  private readonly cartTotal: Locator;
  private readonly removeItemButton: (itemId: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart-message"]');
    this.cartTotal = page.locator('[data-testid="cart-total"]');
    this.removeItemButton = (itemId: string) => 
      page.locator(`[data-testid="remove-item-${itemId}"]`);
  }

  /**
   * Navigate to cart page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to cart page');
    await this.goto('https://example.com/cart');
  }

  /**
   * Get all cart items
   */
  async getCartItems(): Promise<CartItem[]> {
    this.logger.info('Fetching cart items');
    
    const count = await this.cartItems.count();
    if (count === 0) {
      this.logger.info('Cart is empty');
      return [];
    }

    const items: CartItem[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);
      const id = await item.getAttribute('data-item-id') || `item-${i}`;
      const name = await item.locator('[data-testid="item-name"]').textContent() || '';
      const priceText = await item.locator('[data-testid="item-price"]').textContent() || '0';
      const quantityText = await item.locator('[data-testid="item-quantity"]').inputValue() || '1';
      const subtotalText = await item.locator('[data-testid="item-subtotal"]').textContent() || '0';

      items.push({
        id,
        name: name.trim(),
        price: parseFloat(priceText.replace('$', '')),
        quantity: parseInt(quantityText),
        subtotal: parseFloat(subtotalText.replace('$', '')),
      });
    }

    return items;
  }

  /**
   * Get cart total
   */
  async getTotal(): Promise<number> {
    const totalText = await this.cartTotal.textContent();
    const total = parseFloat(totalText?.replace('$', '') || '0');
    return total;
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    const isVisible = await this.emptyCartMessage.isVisible({ timeout: 2000 }).catch(() => false);
    return isVisible;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    this.logger.info(`Updating quantity for item ${itemId} to ${quantity}`);
    const quantityInput = this.page.locator(`[data-item-id="${itemId}"] [data-testid="item-quantity"]`);
    await quantityInput.fill(quantity.toString());
    await this.page.waitForTimeout(300);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemNameOrId: string): Promise<void> {
    this.logger.info(`Removing item from cart`);
    // Try to remove by name first
    const items = await this.getCartItems();
    const item = items.find(i => i.name === itemNameOrId || i.id === itemNameOrId);
    
    if (item) {
      await this.removeItemButton(item.id).click();
    } else {
      // Fallback: try removing by ID anyway
      await this.removeItemButton(itemNameOrId).click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    this.logger.info('Clearing cart');
    const items = await this.getCartItems();
    for (const item of items) {
      await this.removeItem(item.id);
    }
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    this.logger.info('Proceeding to checkout');
    await this.checkoutButton.click();
    await this.page.waitForURL(/.*checkout.*/);
  }

  /**
   * Click checkout button (alias for proceedToCheckout)
   */
  async clickCheckout(): Promise<void> {
    await this.proceedToCheckout();
  }

  /**
   * Get total count of items
   */
  async getItemCount(): Promise<number> {
    const items = await this.getCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get subtotal
   */
  async getSubtotal(): Promise<number> {
    const subtotalLocator = this.page.locator('[data-testid="cart-subtotal"]');
    const subtotalText = await subtotalLocator.textContent();
    return parseFloat(subtotalText?.replace('$', '') || '0');
  }

  /**
   * Get tax amount
   */
  async getTax(): Promise<number> {
    const taxLocator = this.page.locator('[data-testid="cart-tax"]');
    const taxText = await taxLocator.textContent();
    return parseFloat(taxText?.replace('$', '') || '0');
  }

  /**
   * Verify price calculation
   */
  async verifyPriceCalculation(): Promise<boolean> {
    try {
      const subtotal = await this.getSubtotal();
      const tax = await this.getTax();
      const total = await this.getTotal();
      
      // Allow for small rounding differences
      const expectedTotal = parseFloat((subtotal + tax).toFixed(2));
      const difference = Math.abs(total - expectedTotal);
      
      return difference < 0.01;
    } catch {
      return false;
    }
  }

  /**
   * Get all items in cart (alias for getCartItems)
   */
  async getAllItems(): Promise<CartItem[]> {
    return await this.getCartItems();
  }

  /**
   * Update item quantity by product name (wraps updateItemQuantity)
   */
  async updateQuantity(itemName: string, quantity: number): Promise<void> {
    const items = await this.getCartItems();
    const item = items.find(i => i.name === itemName);
    if (item) {
      await this.updateItemQuantity(item.id, quantity);
    } else {
      this.logger.warn(`Item with name "${itemName}" not found in cart`);
    }
  }

  /**
   * Remove item from cart by name (wraps removeItem)
   */
  async removeItemByName(itemName: string): Promise<void> {
    const items = await this.getCartItems();
    const item = items.find(i => i.name === itemName);
    if (item) {
      await this.removeItem(item.id);
    } else {
      this.logger.warn(`Item with name "${itemName}" not found in cart`);
    }
  }
  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    return await this.isEmpty();
  }

  /**
   * Apply coupon code
   */
  async applyCouponCode(code: string): Promise<void> {
    this.logger.info(`Applying coupon code: ${code}`);
    const couponInput = this.page.locator('[data-testid="coupon-code-input"]');
    const applyButton = this.page.locator('[data-testid="apply-coupon-button"]');
    
    await couponInput.fill(code);
    await applyButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get discount amount
   */
  async getDiscountAmount(): Promise<number> {
    const discountLocator = this.page.locator('[data-testid="discount-amount"]');
    const discountText = await discountLocator.textContent();
    return parseFloat(discountText?.replace('$', '').replace('-', '') || '0');
  }

  /**
   * Click continue shopping button
   */
  async clickContinueShopping(): Promise<void> {
    this.logger.info('Clicking continue shopping');
    const continueButton = this.page.locator('[data-testid="continue-shopping-button"]');
    await continueButton.click();
    await this.page.waitForURL(/.*products.*/);
  }}


/**
 * Shopping Page Object Model
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { createLogger } from '@/utils/logger.js';

export interface CartItem {
  productName: string;
  quantity: number;
  price: number;
}

export class ShoppingPage extends BasePage {
  // Locators
  private readonly productGrid: Locator;
  private readonly productCard: Locator;
  private readonly addToCartButton: Locator;
  private readonly filterButton: Locator;
  private readonly sortDropdown: Locator;
  private readonly cartIcon: Locator;
  private readonly cartBadge: Locator;
  private readonly searchInput: Locator;

  private logger = createLogger('ShoppingPage');

  constructor(page: Page) {
    super(page);
    this.productGrid = page.locator('[data-testid="product-grid"]');
    this.productCard = page.locator('[data-testid="product-card"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.filterButton = page.locator('[data-testid="filter-button"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.cartBadge = page.locator('[data-testid="cart-badge"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
  }

  /**
   * Navigate to products page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to shopping page');
    await this.page.goto('/products');
    await this.waitForElement(this.productGrid);
  }

  /**
   * Get number of products displayed
   */
  async getProductCount(): Promise<number> {
    const count = await this.productCard.count();
    this.logger.info(`Found ${count} products`);
    return count;
  }

  /**
   * Get product by name
   */
  async getProductByName(productName: string): Promise<Locator> {
    this.logger.info(`Searching for product: ${productName}`);
    return this.page.locator(
      `[data-testid="product-card"]:has-text("${productName}")`
    );
  }

  /**
   * Get product price
   */
  async getProductPrice(productName: string): Promise<number> {
    const product = await this.getProductByName(productName);
    const priceText = await product
      .locator('[data-testid="product-price"]')
      .textContent();
    const price = parseFloat(priceText?.replace('$', '') || '0');
    this.logger.info(`Product ${productName} price: $${price}`);
    return price;
  }

  /**
   * Add product to cart by name
   */
  async addProductToCart(productName: string, quantity: number = 1): Promise<void> {
    this.logger.info(`Adding ${quantity}x "${productName}" to cart`);
    const product = await this.getProductByName(productName);

    // Set quantity if needed
    if (quantity > 1) {
      const quantityInput = product.locator('[data-testid="quantity-input"]');
      await quantityInput.fill(quantity.toString());
    }

    // Click add to cart
    await product.locator('[data-testid="add-to-cart"]').click();
    await this.waitForToast('Added to cart');
  }

  /**
   * Search for product
   */
  async searchProduct(searchTerm: string): Promise<void> {
    this.logger.info(`Searching for: ${searchTerm}`);
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.waitForElement(this.productGrid);
  }

  /**
   * Filter products by category
   */
  async filterByCategory(category: string): Promise<void> {
    this.logger.info(`Filtering by category: ${category}`);
    await this.filterButton.click();
    await this.page.locator(`text=${category}`).click();
    await this.waitForElement(this.productGrid);
  }

  /**
   * Sort products
   */
  async sortProducts(sortOption: string): Promise<void> {
    this.logger.info(`Sorting by: ${sortOption}`);
    await this.sortDropdown.selectOption(sortOption);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get cart count from badge
   */
  async getCartCount(): Promise<number> {
    const badge = await this.cartBadge.textContent();
    const count = parseInt(badge || '0');
    this.logger.info(`Cart count: ${count}`);
    return count;
  }

  /**
   * Click on cart icon
   */
  async clickCart(): Promise<void> {
    this.logger.info('Clicking on cart icon');
    await this.cartIcon.click();
  }

  /**
   * Verify product is visible
   */
  async isProductVisible(productName: string): Promise<boolean> {
    const product = await this.getProductByName(productName);
    const visible = await product.isVisible();
    this.logger.info(`Product "${productName}" visible: ${visible}`);
    return visible;
  }

  /**
   * Get all visible product names
   */
  async getAllProductNames(): Promise<string[]> {
    const names = await this.productCard
      .locator('[data-testid="product-name"]')
      .allTextContents();
    this.logger.info(`Found products: ${names.join(', ')}`);
    return names;
  }

  /**
   * Check if product has discount badge
   */
  async hasDiscount(productName: string): Promise<boolean> {
    const product = await this.getProductByName(productName);
    const badge = product.locator('[data-testid="discount-badge"]');
    const hasDiscount = await badge.isVisible();
    this.logger.info(`Product "${productName}" has discount: ${hasDiscount}`);
    return hasDiscount;
  }
}

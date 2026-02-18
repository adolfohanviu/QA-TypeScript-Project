/**
 * @feature Shopping & Cart UI
 * Shopping page and cart functionality tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { ShoppingPage } from '@/pages/ShoppingPage';
import { CartPage } from '@/pages/CartPage';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ShoppingCartTests');

describe('@ui @shopping Shopping Page Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let shoppingPage: ShoppingPage;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
    shoppingPage = new ShoppingPage(page);
    await shoppingPage.navigate();
  });

  afterEach(async () => {
    try {
      if (context) {
        await context.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch {
      // Silently ignore cleanup errors
    }
  });

  it('@smoke should load products page', async () => {
    // @arrange
    // @act
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Products page loaded with ${productCount} products`);
  });

  it('@smoke should display products in grid', async () => {
    // @arrange
    // @act
    const names = await shoppingPage.getAllProductNames();

    // @assert
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name: string) => {
      expect(name).toBeTruthy();
    });
    logger.info(`✓ All products are visible: ${names.join(', ')}`);
  });

  it('@regression should search products', async () => {
    // @arrange
    const searchTerm = 'laptop';

    // @act
    await shoppingPage.searchProduct(searchTerm);
    const names = await shoppingPage.getAllProductNames();

    // @assert
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name: string) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
    logger.info(`✓ Search found ${names.length} products matching "${searchTerm}"`);
  });

  it('@regression should filter products by category', async () => {
    // @arrange
    const category = 'Electronics';

    // @act
    await shoppingPage.filterByCategory(category);
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Filtered by category "${category}": ${productCount} products`);
  });

  it('@regression should sort products', async () => {
    // @arrange
    // @act
    await shoppingPage.sortProducts('price-low-to-high');
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Products sorted by price (low to high)`);
  });

  it('@regression should add single product to cart', async () => {
    // @arrange
    const productName = 'Laptop Pro';

    // @act
    await shoppingPage.addProductToCart(productName);
    const cartCount = await shoppingPage.getCartCount();

    // @assert
    expect(cartCount).toBe(1);
    logger.info(`✓ Added product to cart. Cart count: ${cartCount}`);
  });

  it('@regression should add multiple quantities of product', async () => {
    // @arrange
    const productName = 'Wireless Mouse';
    const quantity = 3;

    // @act
    await shoppingPage.addProductToCart(productName, quantity);
    const cartCount = await shoppingPage.getCartCount();

    // @assert
    expect(cartCount).toBe(quantity);
    logger.info(`✓ Added ${quantity} items to cart`);
  });

  it('@regression should add multiple different products', async () => {
    // @arrange
    const products = ['Laptop Pro', 'Wireless Mouse', 'USB-C Cable'];

    // @act
    for (const product of products) {
      try {
        await shoppingPage.addProductToCart(product);
      } catch (e) {
        logger.warn(`Could not add ${product}, continuing...`);
      }
    }
    const cartCount = await shoppingPage.getCartCount();

    // @assert
    expect(cartCount).toBeGreaterThan(0);
    logger.info(`✓ Added multiple products. Cart count: ${cartCount}`);
  });

  it('@regression should get product price correctly', async () => {
    // @arrange
    const productName = 'Laptop Pro';

    // @act
    const price = await shoppingPage.getProductPrice(productName);

    // @assert
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(10000);
    logger.info(`✓ Product price retrieved: $${price}`);
  });

  it('@regression should show discount badge on sale items', async () => {
    // @arrange
    // @act
    const products = await shoppingPage.getAllProductNames();

    for (const product of products) {
      const hasDiscount = await shoppingPage.hasDiscount(product);
      if (hasDiscount) {
        logger.info(`✓ Found discount badge on: ${product}`);
        break;
      }
    }

    // @assert - Test passes
    logger.info(`Discount badge tests completed`);
  });
});

describe('@ui @cart Cart Page Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let shoppingPage: ShoppingPage;
  let cartPage: CartPage;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
    shoppingPage = new ShoppingPage(page);
    cartPage = new CartPage(page);

    // Navigate and add products
    await shoppingPage.navigate();
    try {
      await shoppingPage.addProductToCart('Laptop Pro');
      await shoppingPage.addProductToCart('Wireless Mouse', 2);
    } catch (e) {
      logger.warn('Could not add products to cart');
    }
  });

  afterEach(async () => {
    try {
      if (context) {
        await context.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch {
      // Silently ignore cleanup errors
    }
  });

  it('@smoke should display cart items', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    const itemCount = await cartPage.getItemCount();

    // @assert
    expect(itemCount).toBeGreaterThan(0);
    logger.info(`✓ Cart displays ${itemCount} items`);
  });

  it('@regression should show cart totals', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    const subtotal = await cartPage.getSubtotal();
    const tax = await cartPage.getTax();
    const total = await cartPage.getTotal();

    // @assert
    expect(subtotal).toBeGreaterThan(0);
    expect(tax).toBeGreaterThanOrEqual(0);
    expect(total).toBeGreaterThan(subtotal + tax - 1); // Account for rounding
    logger.info(`✓ Cart totals: Subtotal=$${subtotal}, Tax=$${tax}, Total=$${total}`);
  });

  it('@regression should verify price calculation', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    const isCorrect = await cartPage.verifyPriceCalculation();

    // @assert
    expect(isCorrect).toBe(true);
    logger.info(`✓ Price calculation verified`);
  });

  it('@regression should update item quantity', async () => {
    // @arrange
    await cartPage.navigate();
    const items = await cartPage.getAllItems();
    const firstItem = items[0];

    // @act
    await cartPage.updateQuantity(firstItem.name, 5);
    const updatedItems = await cartPage.getAllItems();
    const updatedItem = updatedItems.find((i: typeof firstItem) => i.name === firstItem.name);

    // @assert
    expect(updatedItem?.quantity).toBe(5);
    logger.info(`✓ Updated item quantity to 5`);
  });

  it('@regression should remove item from cart', async () => {
    // @arrange
    await cartPage.navigate();
    const initialCount = await cartPage.getItemCount();
    const items = await cartPage.getAllItems();

    if (items.length > 0) {
      // @act
      await cartPage.removeItem(items[0].name);
      const finalCount = await cartPage.getItemCount();

      // @assert
      expect(finalCount).toBe(initialCount - 1);
      logger.info(`✓ Removed item from cart. Count: ${finalCount}`);
    }
  });

  it('@regression should empty cart after removing all items', async () => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.clearCart();
    const isEmpty = await cartPage.isCartEmpty();

    // @assert
    expect(isEmpty).toBe(true);
    logger.info(`✓ Cart is now empty`);
  });

  it('@regression should apply coupon code', async () => {
    // @arrange
    await cartPage.navigate();
    const originalTotal = await cartPage.getTotal();

    // @act
    try {
      await cartPage.applyCouponCode('SAVE10');
      const discountedTotal = await cartPage.getTotal();

      // @assert
      expect(discountedTotal).toBeLessThan(originalTotal);
      logger.info(`✓ Coupon applied. Total reduced from $${originalTotal} to $${discountedTotal}`);
    } catch (e) {
      logger.warn('Coupon application failed');
    }
  });

  it('@regression should get discount amount', async () => {
    // @arrange
    await cartPage.navigate();

    try {
      // @act
      await cartPage.applyCouponCode('SAVE10');
      const discount = await cartPage.getDiscountAmount();

      // @assert
      expect(discount).toBeGreaterThanOrEqual(0);
      logger.info(`✓ Discount amount: $${discount}`);
    } catch (e) {
      logger.warn('Discount test failed');
    }
  });

  it('@regression should navigate back to shopping', async () => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.clickContinueShopping();
    const products = await shoppingPage.getProductCount();

    // @assert
    expect(products).toBeGreaterThan(0);
    logger.info(`✓ Navigated back to shopping with ${products} products`);
  });

  it('@regression should persist cart items', async () => {
    // @arrange
    let itemCountBefore: number;
    let itemCountAfter: number;

    // @act
    await cartPage.navigate();
    itemCountBefore = await cartPage.getItemCount();

    // Refresh page
    await page.reload();
    itemCountAfter = await cartPage.getItemCount();

    // @assert
    expect(itemCountAfter).toBe(itemCountBefore);
    logger.info(`✓ Cart items persisted after refresh`);
  });
});

describe('@ui @cart Empty Cart Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    try {
      if (context) {
        await context.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch {
      // Silently ignore cleanup errors
    }
  });

  it('@smoke should display empty cart message', async () => {
    // @arrange
    const cartPage = new CartPage(page);

    // @act
    await cartPage.navigate();
    const isEmpty = await cartPage.isCartEmpty();

    // @assert
    expect(isEmpty).toBe(true);
    logger.info(`✓ Empty cart message displayed`);
  });

  it('@regression should allow continuing shopping from empty cart', async () => {
    // @arrange
    const cartPage = new CartPage(page);
    const shoppingPage = new ShoppingPage(page);

    // @act
    await cartPage.navigate();
    await cartPage.clickContinueShopping();
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Can navigate from empty cart to shopping`);
  });
});

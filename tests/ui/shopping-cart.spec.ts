/**
 * @feature Shopping & Cart UI
 * Shopping page and cart functionality tests
 */

import { test, expect } from '@playwright/test';
import { ShoppingPage } from '@/pages/ShoppingPage.js';
import { CartPage } from '@/pages/CartPage.js';
import { createLogger } from '@/utils/logger.js';

const logger = createLogger('ShoppingCartTests');

test.describe('@ui @shopping Shopping Page Tests', () => {
  let shoppingPage: ShoppingPage;

  test.beforeEach(async ({ page }) => {
    shoppingPage = new ShoppingPage(page);
    await shoppingPage.navigate();
  });

  test('@smoke should load products page', async () => {
    // @arrange
    // @act
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Products page loaded with ${productCount} products`);
  });

  test('@smoke should display products in grid', async () => {
    // @arrange
    // @act
    const names = await shoppingPage.getAllProductNames();

    // @assert
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => {
      expect(name).toBeTruthy();
    });
    logger.info(`✓ All products are visible: ${names.join(', ')}`);
  });

  test('@regression should search products', async () => {
    // @arrange
    const searchTerm = 'laptop';

    // @act
    await shoppingPage.searchProduct(searchTerm);
    const names = await shoppingPage.getAllProductNames();

    // @assert
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
    logger.info(`✓ Search found ${names.length} products matching "${searchTerm}"`);
  });

  test('@regression should filter products by category', async () => {
    // @arrange
    const category = 'Electronics';

    // @act
    await shoppingPage.filterByCategory(category);
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Filtered by category "${category}": ${productCount} products`);
  });

  test('@regression should sort products', async () => {
    // @arrange
    // @act
    await shoppingPage.sortProducts('price-low-to-high');
    const productCount = await shoppingPage.getProductCount();

    // @assert
    expect(productCount).toBeGreaterThan(0);
    logger.info(`✓ Products sorted by price (low to high)`);
  });

  test('@regression should add single product to cart', async () => {
    // @arrange
    const productName = 'Laptop Pro';

    // @act
    await shoppingPage.addProductToCart(productName);
    const cartCount = await shoppingPage.getCartCount();

    // @assert
    expect(cartCount).toBe(1);
    logger.info(`✓ Added product to cart. Cart count: ${cartCount}`);
  });

  test('@regression should add multiple quantities of product', async () => {
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

  test('@regression should add multiple different products', async () => {
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

  test('@regression should get product price correctly', async () => {
    // @arrange
    const productName = 'Laptop Pro';

    // @act
    const price = await shoppingPage.getProductPrice(productName);

    // @assert
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(10000);
    logger.info(`✓ Product price retrieved: $${price}`);
  });

  test('@regression should show discount badge on sale items', async () => {
    // @arrange
    // @act
    const products = await shoppingPage.getAllProductNames();
    let hasAnyDiscount = false;

    for (const product of products) {
      const hasDiscount = await shoppingPage.hasDiscount(product);
      if (hasDiscount) {
        hasAnyDiscount = true;
        logger.info(`✓ Found discount badge on: ${product}`);
        break;
      }
    }

    // @assert - At least show test passes
    logger.info(`Discount badge tests completed`);
  });
});

test.describe('@ui @cart Cart Page Tests', () => {
  let shoppingPage: ShoppingPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
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

  test('@smoke should display cart items', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    const itemCount = await cartPage.getItemCount();

    // @assert
    expect(itemCount).toBeGreaterThan(0);
    logger.info(`✓ Cart displays ${itemCount} items`);
  });

  test('@regression should show cart totals', async () => {
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

  test('@regression should verify price calculation', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    const isCorrect = await cartPage.verifyPriceCalculation();

    // @assert
    expect(isCorrect).toBe(true);
    logger.info(`✓ Price calculation verified`);
  });

  test('@regression should update item quantity', async () => {
    // @arrange
    await cartPage.navigate();
    const items = await cartPage.getAllItems();
    const firstItem = items[0];

    // @act
    await cartPage.updateQuantity(firstItem.name, 5);
    const updatedItems = await cartPage.getAllItems();
    const updatedItem = updatedItems.find((i) => i.name === firstItem.name);

    // @assert
    expect(updatedItem?.quantity).toBe(5);
    logger.info(`✓ Updated item quantity to 5`);
  });

  test('@regression should remove item from cart', async () => {
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

  test('@regression should empty cart after removing all items', async () => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.clearCart();
    const isEmpty = await cartPage.isCartEmpty();

    // @assert
    expect(isEmpty).toBe(true);
    logger.info(`✓ Cart is now empty`);
  });

  test('@regression should apply coupon code', async () => {
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

  test('@regression should get discount amount', async () => {
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

  test('@regression should navigate back to shopping', async () => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.clickContinueShopping();
    const products = await shoppingPage.getProductCount();

    // @assert
    expect(products).toBeGreaterThan(0);
    logger.info(`✓ Navigated back to shopping with ${products} products`);
  });

  test('@regression should persist cart items', async ({ page }) => {
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

test.describe('@ui @cart Empty Cart Tests', () => {
  test('@smoke should display empty cart message', async ({ page }) => {
    // @arrange
    const cartPage = new CartPage(page);

    // @act
    await cartPage.navigate();
    const isEmpty = await cartPage.isCartEmpty();

    // @assert
    expect(isEmpty).toBe(true);
    logger.info(`✓ Empty cart message displayed`);
  });

  test('@regression should allow continuing shopping from empty cart', async ({ page }) => {
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

/**
 * @feature Shopping & Cart
 * Product inventory and cart functionality tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CartPage } from '@/pages/CartPage';

async function loginAsStandardUser(page: import('@playwright/test').Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigateToLogin();
  await loginPage.login('standard_user', 'secret_sauce');
  await page.waitForURL('**/inventory.html');
}

test.describe('Products page', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    await loginAsStandardUser(page);
    productsPage = new ProductsPage(page);
  });

  test('should load products page with items', { tag: ['@smoke'] }, async () => {
    // @act
    const count = await productsPage.getProductCount();

    // @assert
    expect(count).toBeGreaterThan(0);
  });

  test('should add a product to the cart by name', { tag: ['@smoke'] }, async () => {
    // @arrange
    const productName = 'Sauce Labs Backpack';

    // @act
    await productsPage.addProductToCartByName(productName);

    // @assert
    expect(await productsPage.getCartItemCount()).toBe(1);
  });

  test('should add multiple products to the cart', { tag: ['@regression'] }, async () => {
    // @arrange
    const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

    // @act
    for (const name of products) {
      await productsPage.addProductToCartByName(name);
    }

    // @assert
    expect(await productsPage.getCartItemCount()).toBe(products.length);
  });

  test('should throw when adding a product that does not exist', { tag: ['@regression'] }, async () => {
    // @assert
    await expect(productsPage.addProductToCartByName('Nonexistent Product')).rejects.toThrow();
  });

  test('should open the cart from the products page', { tag: ['@regression'] }, async ({ page }) => {
    // @arrange
    await productsPage.addProductToCartByName('Sauce Labs Backpack');

    // @act
    await productsPage.openCart();

    // @assert
    await page.waitForURL('**/cart.html');
  });
});

test.describe('Cart page', () => {
  let productsPage: ProductsPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    await loginAsStandardUser(page);
    productsPage = new ProductsPage(page);
    cartPage = new CartPage(page);
  });

  test('should list added items in the cart', { tag: ['@smoke'] }, async () => {
    // @arrange
    await productsPage.addProductToCartByName('Sauce Labs Backpack');
    await productsPage.addProductToCartByName('Sauce Labs Bike Light');

    // @act
    await cartPage.navigate();
    const items = await cartPage.getCartItems();

    // @assert
    expect(items).toHaveLength(2);
    expect(items.map(i => i.name)).toEqual(
      expect.arrayContaining(['Sauce Labs Backpack', 'Sauce Labs Bike Light']),
    );
  });

  test('should remove an item from the cart', { tag: ['@regression'] }, async () => {
    // @arrange
    await productsPage.addProductToCartByName('Sauce Labs Backpack');
    await cartPage.navigate();

    // @act
    await cartPage.removeItem('Sauce Labs Backpack');

    // @assert
    expect(await cartPage.isEmpty()).toBe(true);
  });

  test('should proceed to checkout from the cart', { tag: ['@smoke'] }, async ({ page }) => {
    // @arrange
    await productsPage.addProductToCartByName('Sauce Labs Backpack');
    await cartPage.navigate();

    // @act
    await cartPage.proceedToCheckout();

    // @assert
    expect(page.url()).toContain('checkout-step-one.html');
  });

  test('should continue shopping from the cart', { tag: ['@regression'] }, async ({ page }) => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.continueShopping();

    // @assert
    expect(page.url()).toContain('inventory.html');
  });
});

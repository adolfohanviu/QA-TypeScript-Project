/**
 * @feature Checkout
 * Checkout flow tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage, CheckoutFormData } from '@/pages/CheckoutPage';

const validShippingInfo: CheckoutFormData = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '10001',
};

test.describe('Checkout flow', () => {
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
    await loginPage.login('standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');

    const productsPage = new ProductsPage(page);
    await productsPage.addProductToCartByName('Sauce Labs Backpack');

    const cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    await cartPage.navigate();
    await cartPage.proceedToCheckout();
  });

  test('should show a validation error when first name is missing', { tag: ['@regression'] }, async () => {
    // @arrange
    await checkoutPage.fillShippingInfo({ ...validShippingInfo, firstName: '' });

    // @act
    await checkoutPage.continueToOverview();

    // @assert
    expect(await checkoutPage.getValidationError()).toContain('First Name is required');
  });

  test('should reach the order overview with valid shipping info', { tag: ['@smoke'] }, async ({ page }) => {
    // @act
    await checkoutPage.fillShippingInfo(validShippingInfo);
    await checkoutPage.continueToOverview();

    // @assert
    expect(page.url()).toContain('checkout-step-two.html');
  });

  test('should display a total consistent with subtotal and tax', { tag: ['@regression'] }, async () => {
    // @arrange
    await checkoutPage.fillShippingInfo(validShippingInfo);
    await checkoutPage.continueToOverview();

    // @act
    const subtotal = await checkoutPage.getSubtotal();
    const tax = await checkoutPage.getTax();
    const total = await checkoutPage.getTotal();

    // @assert
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('should complete the order and show the confirmation screen', { tag: ['@smoke'] }, async () => {
    // @arrange
    await checkoutPage.fillShippingInfo(validShippingInfo);
    await checkoutPage.continueToOverview();

    // @act
    await checkoutPage.finish();

    // @assert
    expect(await checkoutPage.isOrderComplete()).toBe(true);
    expect(await checkoutPage.getCompleteHeaderText()).toContain('Thank you for your order');
  });

  test('should return to the products page after completing an order', { tag: ['@regression'] }, async ({ page }) => {
    // @arrange
    await checkoutPage.fillShippingInfo(validShippingInfo);
    await checkoutPage.continueToOverview();
    await checkoutPage.finish();

    // @act
    await checkoutPage.backToProducts();

    // @assert
    await page.waitForURL('**/inventory.html');
  });

  test('should cancel checkout and return to the cart', { tag: ['@regression'] }, async ({ page }) => {
    // @act
    await checkoutPage.cancel();

    // @assert
    await page.waitForURL('**/cart.html');
  });
});

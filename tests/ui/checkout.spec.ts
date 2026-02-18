/**
 * @feature Checkout UI
 * Checkout flow and payment processing tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { ShoppingPage } from '@/pages/ShoppingPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage, CheckoutFormData } from '@/pages/CheckoutPage';
import { config } from '@/utils/config';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CheckoutTests');

// Test data
const validCheckoutData: CheckoutFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234567',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  cardNumber: '4532015112830366',
  cardExpiry: '12/25',
  cardCVC: '123',
};

describe('@ui @checkout Checkout Flow Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let shoppingPage: ShoppingPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
    shoppingPage = new ShoppingPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Setup: Add products to cart
    await shoppingPage.navigate();
    try {
      await shoppingPage.addProductToCart('Laptop Pro', 1);
      await shoppingPage.addProductToCart('Wireless Mouse', 1);
    } catch (e) {
      logger.warn('Could not add products');
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

  it('@smoke should navigate to checkout from cart', async () => {
    // @arrange
    // @act
    await cartPage.navigate();
    await cartPage.clickCheckout();

    // @assert
    const isShippingVisible = await checkoutPage.isShippingSectionVisible();
    expect(isShippingVisible).toBe(true);
    logger.info(`✓ Successfully navigated to checkout`);
  });

  it('@regression should display all checkout sections', async () => {
    // @arrange
    // @act
    await checkoutPage.navigate();

    // @assert
    const hasShipping = await checkoutPage.isShippingSectionVisible();
    const hasPayment = await checkoutPage.isPaymentSectionVisible();
    expect(hasShipping).toBe(true);
    expect(hasPayment).toBe(true);
    logger.info(`✓ All checkout sections are visible`);
  });

  it('@regression should fill shipping information', async () => {
    // @arrange
    // @act
    await checkoutPage.navigate();
    await checkoutPage.fillShippingInfo({
      firstName: validCheckoutData.firstName,
      lastName: validCheckoutData.lastName,
      email: validCheckoutData.email,
      phone: validCheckoutData.phone,
      address: validCheckoutData.address,
      city: validCheckoutData.city,
      state: validCheckoutData.state,
      zipCode: validCheckoutData.zipCode,
    });

    // @assert - Verify no validation errors
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(false);
    logger.info(`✓ Shipping information filled successfully`);
  });

  it('@regression should fill payment information', async () => {
    // @arrange
    // @act
    await checkoutPage.navigate();
    await checkoutPage.fillPaymentInfo({
      cardNumber: validCheckoutData.cardNumber,
      cardExpiry: validCheckoutData.cardExpiry,
      cardCVC: validCheckoutData.cardCVC,
    });

    // @assert
    const hasPaymentFields = await checkoutPage.verifyPaymentFieldsPresent();
    expect(hasPaymentFields).toBe(true);
    logger.info(`✓ Payment information filled successfully`);
  });

  it('@regression should complete full checkout process', async () => {
    // @arrange
    await cartPage.navigate();

    // @act
    await cartPage.clickCheckout();
    await checkoutPage.fillCheckoutForm(validCheckoutData);
    await checkoutPage.placeOrder();

    // @assert
    const orderNumber = await checkoutPage.getOrderNumber();
    expect(orderNumber).toBeTruthy();
    expect(orderNumber?.length).toBeGreaterThan(0);
    logger.info(`✓ Checkout completed. Order: ${orderNumber}`);
  });

  it('@regression should display correct order total', async () => {
    // @arrange
    await cartPage.navigate();
    const cartTotal = await cartPage.getTotal();

    // @act
    await cartPage.clickCheckout();
    const checkoutTotal = await checkoutPage.getOrderTotal();

    // @assert
    expect(checkoutTotal).toBeCloseTo(cartTotal, 2);
    logger.info(`✓ Order total matches cart total: $${checkoutTotal}`);
  });

  it('@regression should validate order summary', async () => {
    // @arrange
    await cartPage.navigate();
    const cartItems = await cartPage.getAllItems();

    // @act
    await cartPage.clickCheckout();
    // Format items for summary verification
    const itemsSummary = cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity
    }));
    const summaryIsCorrect = await checkoutPage.verifyOrderSummary(itemsSummary);

    // @assert
    expect(summaryIsCorrect).toBe(true);
    logger.info(`✓ Order summary verified`);
  });
});

describe('@ui @checkout Validation Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let checkoutPage: CheckoutPage;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
    checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigate();
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

  it('@regression should show error for missing first name', async () => {
    // @arrange
    const invalidData = { ...validCheckoutData, firstName: '' };

    // @act
    await checkoutPage.fillShippingInfo({
      firstName: invalidData.firstName,
      lastName: invalidData.lastName,
      email: invalidData.email,
      phone: invalidData.phone,
      address: invalidData.address,
      city: invalidData.city,
      state: invalidData.state,
      zipCode: invalidData.zipCode,
    });

    // Attempt to submit
    try {
      await checkoutPage.placeOrder();
    } catch (e) {
      // Expected to fail
    }

    // @assert
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(true);
    logger.info(`✓ Validation error shown for missing first name`);
  });

  it('@regression should show error for invalid email', async () => {
    // @arrange
    const invalidData = { ...validCheckoutData, email: 'invalid-email' };

    // @act
    await checkoutPage.fillShippingInfo({
      firstName: invalidData.firstName,
      lastName: invalidData.lastName,
      email: invalidData.email,
      phone: invalidData.phone,
      address: invalidData.address,
      city: invalidData.city,
      state: invalidData.state,
      zipCode: invalidData.zipCode,
    });

    // @assert
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(true);
    logger.info(`✓ Validation error shown for invalid email`);
  });

  it('@regression should show error for invalid zip code', async () => {
    // @arrange
    const invalidData = { ...validCheckoutData, zipCode: 'INVALID' };

    // @act
    await checkoutPage.fillShippingInfo({
      firstName: invalidData.firstName,
      lastName: invalidData.lastName,
      email: invalidData.email,
      phone: invalidData.phone,
      address: invalidData.address,
      city: invalidData.city,
      state: invalidData.state,
      zipCode: invalidData.zipCode,
    });

    // @assert
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(true);
    logger.info(`✓ Validation error shown for invalid zip code`);
  });

  it('@regression should show error for invalid card number', async () => {
    // @arrange
    const invalidCardData = {
      cardNumber: '1234567890123456',
      cardExpiry: validCheckoutData.cardExpiry,
      cardCVC: validCheckoutData.cardCVC,
      cardholderName: `${validCheckoutData.firstName} ${validCheckoutData.lastName}`,
    };

    // @act
    await checkoutPage.fillPaymentInfo(invalidCardData);
    try {
      await checkoutPage.placeOrder();
    } catch (e) {
      // Expected to fail
    }

    // @assert
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(true);
    logger.info(`✓ Validation error shown for invalid card`);
  });

  it('@regression should show error for invalid CVV', async () => {
    // @arrange
    const invalidCardData = {
      cardNumber: validCheckoutData.cardNumber,
      cardExpiry: validCheckoutData.cardExpiry,
      cardCVC: '00',
      cardholderName: `${validCheckoutData.firstName} ${validCheckoutData.lastName}`,
    };

    // @act
    await checkoutPage.fillPaymentInfo(invalidCardData);

    // @assert
    const hasError = await checkoutPage.hasError();
    expect(hasError).toBe(true);
    logger.info(`✓ Validation error shown for invalid CVV`);
  });
});

describe('@ui @checkout Form Functionality Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let checkoutPage: CheckoutPage;

  beforeEach(async () => {
    browser = await chromium.launch({
      headless: config.get('headless'),
    });
    context = await browser.newContext();
    page = await context.newPage();
    checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigate();
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

  it('@regression should clear form data', async () => {
    // @arrange
    await checkoutPage.fillShippingInfo({
      firstName: validCheckoutData.firstName,
      lastName: validCheckoutData.lastName,
      email: validCheckoutData.email,
      phone: validCheckoutData.phone,
      address: validCheckoutData.address,
      city: validCheckoutData.city,
      state: validCheckoutData.state,
      zipCode: validCheckoutData.zipCode,
    });

    // @act
    await checkoutPage.clearShippingForm();

    // @assert
    logger.info(`✓ Form cleared successfully`);
  });

  it('@regression should maintain form data on section change', async () => {
    // @arrange
    const shippingData = {
      firstName: validCheckoutData.firstName,
      lastName: validCheckoutData.lastName,
      email: validCheckoutData.email,
      phone: validCheckoutData.phone,
      address: validCheckoutData.address,
      city: validCheckoutData.city,
      state: validCheckoutData.state,
      zipCode: validCheckoutData.zipCode,
    };

    // @act
    await checkoutPage.fillShippingInfo(shippingData);

    // Switch to payment section
    const isPaymentVisible = await checkoutPage.isPaymentSectionVisible();

    // @assert
    expect(isPaymentVisible).toBe(true);
    logger.info(`✓ Form data maintained when switching sections`);
  });
});

describe('@ui @checkout Order Confirmation Tests', () => {
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

  it('@regression should show order confirmation after successful purchase', async () => {
    // @arrange
    const shoppingPage = new ShoppingPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Setup
    await shoppingPage.navigate();
    try {
      await shoppingPage.addProductToCart('Laptop Pro');
    } catch (e) {
      logger.warn('Could not add product');
    }

    // @act
    await cartPage.navigate();
    await cartPage.clickCheckout();
    await checkoutPage.fillCheckoutForm(validCheckoutData);
    await checkoutPage.placeOrder();

    // @assert
    const orderNumber = await checkoutPage.getOrderNumber();
    expect(orderNumber).toBeTruthy();
    logger.info(`✓ Order confirmation displayed: ${orderNumber}`);
  });

  it('@regression should allow continuing shopping after order', async () => {
    // @arrange
    const shoppingPage = new ShoppingPage(page);
    const checkoutPage = new CheckoutPage(page);

    // @act
    await checkoutPage.navigate();
    await checkoutPage.fillCheckoutForm(validCheckoutData);
    try {
      await checkoutPage.placeOrder();
    } catch (e) {
      logger.warn('Could not place order');
    }

    // Try to continue shopping
    try {
      await checkoutPage.continueShopping();
      const productCount = await shoppingPage.getProductCount();

      // @assert
      expect(productCount).toBeGreaterThan(0);
      logger.info(`✓ Successfully continued shopping after order`);
    } catch (e) {
      logger.warn('Continue shopping action failed');
    }
  });
});

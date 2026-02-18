/**
 * Checkout Page Object Model
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { createLogger } from '@/utils/logger.js';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
}

export class CheckoutPage extends BasePage {
  // Locators - Shipping Section
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly addressInput: Locator;
  private readonly cityInput: Locator;
  private readonly stateSelect: Locator;
  private readonly zipCodeInput: Locator;

  // Locators - Payment Section
  private readonly cardNumberInput: Locator;
  private readonly cardExpiryInput: Locator;
  private readonly cardCVCInput: Locator;
  private readonly cardholderNameInput: Locator;

  // Locators - Order
  private readonly placeOrderButton: Locator;
  private readonly orderSummary: Locator;
  private readonly orderTotal: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly errorAlert: Locator;

  // Locators - Sections
  private readonly shippingSection: Locator;
  private readonly paymentSection: Locator;
  private readonly reviewSection: Locator;

  private logger = createLogger('CheckoutPage');

  constructor(page: Page) {
    super(page);

    // Shipping inputs
    this.firstNameInput = page.locator('[data-testid="firstName"]');
    this.lastNameInput = page.locator('[data-testid="lastName"]');
    this.emailInput = page.locator('[data-testid="email"]');
    this.phoneInput = page.locator('[data-testid="phone"]');
    this.addressInput = page.locator('[data-testid="address"]');
    this.cityInput = page.locator('[data-testid="city"]');
    this.stateSelect = page.locator('[data-testid="state"]');
    this.zipCodeInput = page.locator('[data-testid="zipCode"]');

    // Payment inputs
    this.cardNumberInput = page.locator('[data-testid="cardNumber"]');
    this.cardExpiryInput = page.locator('[data-testid="cardExpiry"]');
    this.cardCVCInput = page.locator('[data-testid="cardCVC"]');
    this.cardholderNameInput = page.locator('[data-testid="cardholderName"]');

    // Order elements
    this.placeOrderButton = page.locator('[data-testid="place-order"]');
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.orderTotal = page.locator('[data-testid="order-total"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
    this.errorAlert = page.locator('[data-testid="error-alert"]');

    // Sections
    this.shippingSection = page.locator('[data-testid="shipping-section"]');
    this.paymentSection = page.locator('[data-testid="payment-section"]');
    this.reviewSection = page.locator('[data-testid="review-section"]');
  }

  /**
   * Navigate to checkout
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to checkout page');
    await this.page.goto('/checkout');
    await this.waitForElement(this.shippingSection);
  }

  /**
   * Fill shipping information
   */
  async fillShippingInfo(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<void> {
    this.logger.info('Filling shipping information');
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.addressInput.fill(data.address);
    await this.cityInput.fill(data.city);
    await this.stateSelect.selectOption(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    this.logger.info('Shipping information filled');
  }

  /**
   * Fill payment information
   */
  async fillPaymentInfo(data: {
    cardNumber: string;
    cardExpiry: string;
    cardCVC: string;
    cardholderName: string;
  }): Promise<void> {
    this.logger.info('Filling payment information');
    await this.cardNumberInput.fill(data.cardNumber);
    await this.cardExpiryInput.fill(data.cardExpiry);
    await this.cardCVCInput.fill(data.cardCVC);
    await this.cardholderNameInput.fill(data.cardholderName);
    this.logger.info('Payment information filled');
  }

  /**
   * Fill complete checkout form
   */
  async fillCheckoutForm(data: CheckoutFormData): Promise<void> {
    this.logger.info('Filling complete checkout form');
    await this.fillShippingInfo({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
    });

    await this.fillPaymentInfo({
      cardNumber: data.cardNumber,
      cardExpiry: data.cardExpiry,
      cardCVC: data.cardCVC,
      cardholderName: `${data.firstName} ${data.lastName}`,
    });
  }

  /**
   * Place order
   */
  async placeOrder(): Promise<void> {
    this.logger.info('Placing order');
    await this.placeOrderButton.click();
    await this.waitForElement(this.orderSummary);
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<number> {
    const text = await this.orderTotal.textContent();
    const amount = parseFloat(text?.replace('$', '') || '0');
    this.logger.info(`Order total: $${amount}`);
    return amount;
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    const message = await this.errorAlert.textContent();
    this.logger.info(`Error message: ${message}`);
    return message || '';
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    const hasError = await this.errorAlert.isVisible();
    this.logger.info(`Has error: ${hasError}`);
    return hasError;
  }

  /**
   * Verify shipping section is visible
   */
  async isShippingSectionVisible(): Promise<boolean> {
    const visible = await this.shippingSection.isVisible();
    this.logger.info(`Shipping section visible: ${visible}`);
    return visible;
  }

  /**
   * Verify payment section is visible
   */
  async isPaymentSectionVisible(): Promise<boolean> {
    const visible = await this.paymentSection.isVisible();
    this.logger.info(`Payment section visible: ${visible}`);
    return visible;
  }

  /**
   * Clear shipping form
   */
  async clearShippingForm(): Promise<void> {
    this.logger.info('Clearing shipping form');
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.phoneInput.clear();
    await this.addressInput.clear();
    await this.cityInput.clear();
    await this.zipCodeInput.clear();
  }

  /**
   * Verify order summary shows correct items
   */
  async verifyOrderSummary(expectedItems: number): Promise<boolean> {
    const items = await this.orderSummary
      .locator('[data-testid="order-item"]')
      .count();
    const isCorrect = items === expectedItems;
    this.logger.info(`Order summary items: ${items}, expected: ${expectedItems}`);
    return isCorrect;
  }

  /**
   * Continue shopping after order
   */
  async continueShopping(): Promise<void> {
    this.logger.info('Clicking continue shopping');
    await this.continueShoppingButton.click();
  }

  /**
   * Get order confirmation number
   */
  async getOrderNumber(): Promise<string> {
    const orderNumber = await this.page
      .locator('[data-testid="order-number"]')
      .textContent();
    this.logger.info(`Order number: ${orderNumber}`);
    return orderNumber || '';
  }

  /**
   * Verify payment section has all required fields
   */
  async verifyPaymentFieldsPresent(): Promise<boolean> {
    const hasCardNumber = await this.cardNumberInput.isVisible();
    const hasExpiry = await this.cardExpiryInput.isVisible();
    const hasCVC = await this.cardCVCInput.isVisible();
    const hasName = await this.cardholderNameInput.isVisible();

    const allPresent = hasCardNumber && hasExpiry && hasCVC && hasName;
    this.logger.info(`All payment fields present: ${allPresent}`);
    return allPresent;
  }
}

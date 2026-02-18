/**
 * Checkout Page Object
 * Handles interactions with the checkout process
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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

export interface CheckoutStep {
  name: string;
  completed: boolean;
  active: boolean;
}

export class CheckoutPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly addressInput: Locator;
  private readonly cityInput: Locator;
  private readonly stateInput: Locator;
  private readonly zipCodeInput: Locator;
  private readonly cardNumberInput: Locator;
  private readonly cardExpiryInput: Locator;
  private readonly cardCVCInput: Locator;
  private readonly placeOrderButton: Locator;
  private readonly nextStepButton: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-testid="first-name"]');
    this.lastNameInput = page.locator('[data-testid="last-name"]');
    this.emailInput = page.locator('[data-testid="email"]');
    this.phoneInput = page.locator('[data-testid="phone"]');
    this.addressInput = page.locator('[data-testid="address"]');
    this.cityInput = page.locator('[data-testid="city"]');
    this.stateInput = page.locator('[data-testid="state"]');
    this.zipCodeInput = page.locator('[data-testid="zip-code"]');
    this.cardNumberInput = page.locator('[data-testid="card-number"]');
    this.cardExpiryInput = page.locator('[data-testid="expiry-date"]');
    this.cardCVCInput = page.locator('[data-testid="cvv"]');
    this.placeOrderButton = page.locator('[data-testid="place-order-button"]');
    this.nextStepButton = page.locator('[data-testid="next-step-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
  }

  /**
   * Navigate to checkout page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to checkout page');
    await this.goto('https://example.com/checkout');
  }

  /**
   * Fill shipping information
   */
  async fillShippingInfo(data: Partial<CheckoutFormData>): Promise<void> {
    this.logger.info('Filling shipping information');
    
    if (data.firstName) {
      await this.firstNameInput.fill(data.firstName);
    }
    if (data.lastName) {
      await this.lastNameInput.fill(data.lastName);
    }
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    if (data.address) {
      await this.addressInput.fill(data.address);
    }
    if (data.city) {
      await this.cityInput.fill(data.city);
    }
    if (data.state) {
      await this.stateInput.fill(data.state);
    }
    if (data.zipCode) {
      await this.zipCodeInput.fill(data.zipCode);
    }
  }

  /**
   * Fill payment information
   */
  async fillPaymentInfo(data: Partial<CheckoutFormData>): Promise<void> {
    this.logger.info('Filling payment information');
    
    if (data.cardNumber) {
      await this.cardNumberInput.fill(data.cardNumber);
    }
    if (data.cardExpiry) {
      await this.cardExpiryInput.fill(data.cardExpiry);
    }
    if (data.cardCVC) {
      await this.cardCVCInput.fill(data.cardCVC);
    }
  }

  /**
   * Go to next step
   */
  async nextStep(): Promise<void> {
    this.logger.info('Moving to next checkout step');
    await this.nextStepButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Place order
   */
  async placeOrder(): Promise<void> {
    this.logger.info('Placing order');
    await this.placeOrderButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if order was successful
   */
  async isOrderSuccessful(): Promise<boolean> {
    const isVisible = await this.successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    return isVisible;
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const visible = await this.errorMessage.isVisible({ timeout: 2000 });
      if (visible) {
        return await this.errorMessage.textContent();
      }
    } catch {
      // No error message
    }
    return null;
  }

  /**
   * Check if form has error
   */
  async hasError(): Promise<boolean> {
    const errorMsg = await this.getErrorMessage();
    return errorMsg !== null && errorMsg.length > 0;
  }

  /**
   * Get current step
   */
  async getCurrentStep(): Promise<string> {
    const activeStep = this.page.locator('[data-testid="step"][data-active="true"]');
    const label = await activeStep.getAttribute('data-step-label');
    return label || 'unknown';
  }

  /**
   * Fill complete checkout form
   */
  async fillCompleteForm(data: CheckoutFormData): Promise<void> {
    this.logger.info('Filling complete checkout form');
    await this.fillShippingInfo(data);
    await this.nextStep();
    await this.fillPaymentInfo(data);
  }

  /**
   * Fill checkout form (alias for fillCompleteForm)
   */
  async fillCheckoutForm(data: CheckoutFormData): Promise<void> {
    await this.fillCompleteForm(data);
  }

  /**
   * Complete checkout process
   */
  async completeCheckout(data: CheckoutFormData): Promise<boolean> {
    this.logger.info('Completing checkout process');
    await this.fillCompleteForm(data);
    await this.placeOrder();
    return await this.isOrderSuccessful();
  }

  /**
   * Verify field values
   */
  async verifyFieldValue(fieldName: keyof CheckoutFormData, expectedValue: string): Promise<boolean> {
    const fieldMap: Record<string, Locator> = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      phone: this.phoneInput,
      address: this.addressInput,
      city: this.cityInput,
      state: this.stateInput,
      zipCode: this.zipCodeInput,
      cardNumber: this.cardNumberInput,
      cardExpiry: this.cardExpiryInput,
      cardCVC: this.cardCVCInput,
    };

    const field = fieldMap[fieldName];
    if (!field) return false;

    const value = await field.inputValue();
    return value === expectedValue;
  }

  /**
   * Clear shipping form
   */
  async clearShippingForm(): Promise<void> {
    this.logger.info('Clearing shipping form');
    await this.firstNameInput.fill('');
    await this.lastNameInput.fill('');
    await this.addressInput.fill('');
    await this.cityInput.fill('');
  }

  /**
   * Check if shipping section is visible
   */
  async isShippingSectionVisible(): Promise<boolean> {
    return await this.firstNameInput.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if payment section is visible
   */
  async isPaymentSectionVisible(): Promise<boolean> {
    return await this.cardNumberInput.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Verify payment fields are present
   */
  async verifyPaymentFieldsPresent(): Promise<boolean> {
    try {
      await this.cardNumberInput.waitFor({ timeout: 2000 });
      await this.cardExpiryInput.waitFor({ timeout: 2000 });
      await this.cardCVCInput.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get order number from confirmation
   */
  async getOrderNumber(): Promise<string | null> {
    try {
      const orderNumber = await this.page.locator('[data-testid="order-number"]').textContent();
      return orderNumber;
    } catch {
      return null;
    }
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<number> {
    try {
      const totalText = await this.page.locator('[data-testid="order-total"]').textContent();
      return parseFloat(totalText?.replace('$', '') || '0');
    } catch {
      return 0;
    }
  }

  /**
   * Verify order summary
   */
  async verifyOrderSummary(items: Array<{ name: string; quantity: number }>): Promise<boolean> {
    try {
      for (const item of items) {
        const itemLocator = this.page.locator(`[data-testid="order-item-${item.name}"]`);
        await itemLocator.waitFor({ timeout: 2000 });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Continue shopping button (redirect to products page)
   */
  async continueShopping(): Promise<void> {
    this.logger.info('Continuing shopping');
    const continueButton = this.page.locator('[data-testid="continue-shopping-button"]');
    if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueButton.click();
      await this.page.waitForURL(/.*products.*/);
    } else {
      // Navigate directly if button not available
      await this.goto('https://example.com/products');
    }
  }
}


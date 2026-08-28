/**
 * Checkout Page Object
 * Handles interactions with the checkout process
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage extends BasePage {
  private readonly selectors = {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continueButton: '[data-test="continue"]',
    cancelButton: '[data-test="cancel"]',
    errorMessage: '[data-test="error"]',
    subtotalLabel: '[data-test="subtotal-label"]',
    taxLabel: '[data-test="tax-label"]',
    totalLabel: '[data-test="total-label"]',
    finishButton: '[data-test="finish"]',
    completeHeader: '[data-test="complete-header"]',
    backToProductsButton: '[data-test="back-to-products"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@checkout');
  }

  /**
   * Extract the trailing $ amount from a full text label
   * e.g. "Item total: $29.99" -> 29.99
   */
  private parseAmount(label: string): number {
    const match = label.match(/\$([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Fill shipping information on checkout step one
   */
  async fillShippingInfo(data: CheckoutFormData): Promise<void> {
    this.logger.info('Filling shipping information');
    await this.fillText(this.selectors.firstName, data.firstName);
    await this.fillText(this.selectors.lastName, data.lastName);
    await this.fillText(this.selectors.postalCode, data.postalCode);
  }

  /**
   * Continue from step one to the order overview
   */
  async continueToOverview(): Promise<void> {
    this.logger.info('Continuing to checkout overview');
    await this.click(this.selectors.continueButton);
  }

  /**
   * Cancel checkout and return to the previous page
   */
  async cancel(): Promise<void> {
    this.logger.info('Cancelling checkout');
    await this.click(this.selectors.cancelButton);
  }

  /**
   * Get the validation error message on step one
   */
  async getValidationError(): Promise<string> {
    if (await this.isVisible(this.selectors.errorMessage)) {
      return await this.getText(this.selectors.errorMessage);
    }
    return '';
  }

  /**
   * Get the item subtotal from step two
   */
  async getSubtotal(): Promise<number> {
    const label = await this.getText(this.selectors.subtotalLabel);
    return this.parseAmount(label);
  }

  /**
   * Get the tax amount from step two
   */
  async getTax(): Promise<number> {
    const label = await this.getText(this.selectors.taxLabel);
    return this.parseAmount(label);
  }

  /**
   * Get the total amount from step two
   */
  async getTotal(): Promise<number> {
    const label = await this.getText(this.selectors.totalLabel);
    return this.parseAmount(label);
  }

  /**
   * Finish the checkout process on step two
   */
  async finish(): Promise<void> {
    this.logger.info('Finishing checkout');
    await this.click(this.selectors.finishButton);
  }

  /**
   * Check whether the order was completed successfully
   */
  async isOrderComplete(): Promise<boolean> {
    return await this.isVisible(this.selectors.completeHeader);
  }

  /**
   * Get the order completion header text
   */
  async getCompleteHeaderText(): Promise<string> {
    return await this.getText(this.selectors.completeHeader);
  }

  /**
   * Navigate back to the products page from the confirmation screen
   */
  async backToProducts(): Promise<void> {
    this.logger.info('Returning to products page');
    await this.click(this.selectors.backToProductsButton);
  }
}

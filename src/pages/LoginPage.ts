/**
 * Login Page Object
 * Handles authentication and login workflows
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Selectors with strong typing
  private readonly selectors = {
    usernameInput: '#user-name',
    passwordInput: '#password',
    loginButton: '#login-button',
    errorMessage: '[data-test="error"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@login');
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.goto(`${this.page.context().browser()?.contexts()[0]?.pages()[0]?.url() || ''}`);
    this.logger.info('Navigated to login page');
  }

  /**
   * Enter username
   */
  async enterUsername(username: string): Promise<void> {
    await this.fillText(this.selectors.usernameInput, username);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    await this.fillText(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLoginButton(): Promise<void> {
    await this.click(this.selectors.loginButton);
  }

  /**
   * Complete login workflow
   */
  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Attempting login for user: ${username}`);
    try {
      await this.enterUsername(username);
      await this.enterPassword(password);
      await this.clickLoginButton();
      this.logger.info(`Login successful for user: ${username}`);
    } catch (error) {
      this.logger.error(`Login failed for user: ${username}`, error as Error);
      throw error;
    }
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.isVisible(this.selectors.errorMessage)) {
      return await this.getText(this.selectors.errorMessage);
    }
    return '';
  }

  /**
   * Check if error is displayed
   */
  async isErrorDisplayed(): Promise<boolean> {
    return await this.isVisible(this.selectors.errorMessage);
  }

  /**
   * Get login button state
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    const element = await this.page.$eval(
      this.selectors.loginButton,
      (el: any) => !el.disabled,
    );
    return element;
  }
}

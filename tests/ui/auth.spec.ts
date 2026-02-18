/**
 * @feature Authentication
 * Login test suite for the application
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage.js';
import { config } from '@/utils/config.js';
import { createLogger } from '@/utils/logger.js';

describe('@smoke @regression Login Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let loginPage: LoginPage;
  const logger = createLogger('LoginTests');

  beforeEach(async () => {
    logger.info('Setting up test environment');
    
    browser = await chromium.launch({
      headless: config.get('headless'),
    });

    context = await browser.createContext();
    page = await context.newPage();
    loginPage = new LoginPage(page);

    // Navigate to login page
    await page.goto(config.get('baseUrl'));
    logger.info('Test environment ready');
  });

  afterEach(async () => {
    logger.info('Tearing down test environment');
    await context.close();
    await browser.close();
  });

  it('@smoke should login with valid credentials', async () => {
    // @arrange
    const username = 'standard_user';
    const password = 'secret_sauce';

    // @act
    await loginPage.login(username, password);
    await page.waitForURL(/.*inventory/);

    // @assert
    expect(page.url()).toContain('inventory');
    logger.info('Login test passed');
  });

  it('@regression should display error for invalid credentials', async () => {
    // @arrange
    const username = 'invalid_user';
    const password = 'wrong_password';

    // @act
    await loginPage.login(username, password);

    // @assert
    const isErrorDisplayed = await loginPage.isErrorDisplayed();
    expect(isErrorDisplayed).toBe(true);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('does not match');
    logger.info('Error message test passed');
  });

  it('@regression should display error for locked out user', async () => {
    // @arrange
    const username = 'locked_out_user';
    const password = 'secret_sauce';

    // @act
    await loginPage.login(username, password);

    // @assert
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('locked out');
    logger.info('Locked out user test passed');
  });

  it('@smoke should have login button enabled', async () => {
    // @assert
    const isEnabled = await loginPage.isLoginButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  it('@regression should clear password field when user types', async () => {
    // @arrange
    const password = 'test_password';

    // @act
    await loginPage.enterPassword(password);

    // @assert
    const value = await page.inputValue('#password');
    expect(value).toBe(password);
  });
});

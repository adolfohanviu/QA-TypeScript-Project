/**
 * @feature Authentication
 * Login test suite for the application
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pages/LoginPage';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  test('should login with valid credentials', { tag: ['@smoke'] }, async ({ page }) => {
    // @arrange
    const username = 'standard_user';
    const password = 'secret_sauce';

    // @act
    await loginPage.login(username, password);
    await page.waitForURL('**/inventory.html');

    // @assert
    expect(page.url()).toContain('inventory.html');
  });

  test('should display error for invalid credentials', { tag: ['@regression'] }, async () => {
    // @arrange
    const username = 'invalid_user';
    const password = 'wrong_password';

    // @act
    await loginPage.login(username, password);

    // @assert
    expect(await loginPage.isErrorDisplayed()).toBe(true);
    expect(await loginPage.getErrorMessage()).toContain('do not match');
  });

  test('should display error for locked out user', { tag: ['@regression'] }, async () => {
    // @arrange
    const username = 'locked_out_user';
    const password = 'secret_sauce';

    // @act
    await loginPage.login(username, password);

    // @assert
    expect(await loginPage.getErrorMessage()).toContain('locked out');
  });

  test('should have login button enabled', { tag: ['@smoke'] }, async () => {
    // @assert
    expect(await loginPage.isLoginButtonEnabled()).toBe(true);
  });

  test('should reflect typed password in the field', { tag: ['@regression'] }, async ({ page }) => {
    // @arrange
    const password = 'test_password';

    // @act
    await loginPage.enterPassword(password);

    // @assert
    await expect(page.locator('#password')).toHaveValue(password);
  });
});

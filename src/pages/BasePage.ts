/**
 * Base Page Object class
 * Provides common page interaction methods with type safety
 */

import { Page, Locator } from '@playwright/test';
import { createLogger } from '@/utils/logger';
import type { TestMetadata } from '@/types/index';

/**
 * Base Page Object Model class
 * All page objects should extend this class
 */
export abstract class BasePage {
  protected page: Page;
  protected logger = createLogger(this.constructor.name);
  protected pageMetadata: TestMetadata;

  constructor(page: Page) {
    this.page = page;
    this.pageMetadata = {
      name: this.constructor.name,
      tags: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Navigate to URL
   */
  async goto(url: string): Promise<void> {
    this.logger.info(`Navigating to ${url}`);
    try {
      await this.page.goto(url, { waitUntil: 'networkidle' });
      this.logger.info(`Successfully navigated to ${url}`);
    } catch (error) {
      this.logger.error(`Failed to navigate to ${url}`, error as Error);
      throw error;
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get page URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 30000): Promise<void> {
    this.logger.debug(`Waiting for element: ${selector}`);
    try {
      await this.page.waitForSelector(selector, { timeout });
      this.logger.debug(`Element found: ${selector}`);
    } catch (error) {
      this.logger.error(`Element not found: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Click on element
   */
  async click(selector: string): Promise<void> {
    this.logger.debug(`Clicking element: ${selector}`);
    try {
      await this.page.click(selector);
      this.logger.debug(`Clicked element: ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to click element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Fill text in input
   */
  async fillText(selector: string, text: string): Promise<void> {
    this.logger.debug(`Filling text in ${selector}: ${text}`);
    try {
      await this.page.fill(selector, text);
      this.logger.debug(`Text filled in ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to fill text in ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Type text more naturally
   */
  async typeText(selector: string, text: string, delay = 50): Promise<void> {
    this.logger.debug(`Typing text in ${selector}: ${text}`);
    try {
      await this.page.locator(selector).type(text, { delay });
      this.logger.debug(`Text typed in ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to type text in ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Get text from element
   */
  async getText(selector: string): Promise<string> {
    try {
      const text = await this.page.textContent(selector);
      return text || '';
    } catch (error) {
      this.logger.error(`Failed to get text from ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    try {
      return await this.page.getAttribute(selector, attribute);
    } catch (error) {
      this.logger.error(`Failed to get attribute from ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.$(selector)) !== null;
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string): Promise<void> {
    this.logger.debug(`Selecting option '${value}' from ${selector}`);
    try {
      await this.page.selectOption(selector, value);
      this.logger.debug(`Selected option '${value}'`);
    } catch (error) {
      this.logger.error(`Failed to select option from ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(filename: string): Promise<Buffer> {
    this.logger.info(`Taking screenshot: ${filename}`);
    try {
      return await this.page.screenshot({
        path: `screenshots/${filename}.png`,
        fullPage: true,
      });
    } catch (error) {
      this.logger.error(`Failed to take screenshot`, error as Error);
      throw error;
    }
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(action: () => Promise<void>): Promise<void> {
    this.logger.debug('Waiting for navigation');
    try {
      await Promise.all([this.page.waitForNavigation(), action()]);
      this.logger.debug('Navigation completed');
    } catch (error) {
      this.logger.error('Navigation timeout', error as Error);
      throw error;
    }
  }

  /**
   * Execute JavaScript
   */
  async executeScript<T>(script: string | (() => T), ...args: unknown[]): Promise<T> {
    try {
      return await this.page.evaluate(script as any, ...args);
    } catch (error) {
      this.logger.error('Script execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Accept browser alert dialog
   */
  async acceptAlert(): Promise<void> {
    this.page.once('dialog', async dialog => {
      this.logger.info(`Accepting alert: ${dialog.message()}`);
      await dialog.accept();
    });
  }

  /**
   * Reject browser alert dialog
   */
  async dismissAlert(): Promise<void> {
    this.page.once('dialog', async dialog => {
      this.logger.info(`Dismissing alert: ${dialog.message()}`);
      await dialog.dismiss();
    });
  }

  /**
   * Double-click element
   */
  async doubleClick(selector: string): Promise<void> {
    this.logger.debug(`Double-clicking element: ${selector}`);
    try {
      await this.page.dblclick(selector);
      this.logger.debug(`Double-clicked element: ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to double-click element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Right-click element
   */
  async rightClick(selector: string): Promise<void> {
    this.logger.debug(`Right-clicking element: ${selector}`);
    try {
      await this.page.click(selector, { button: 'right' });
      this.logger.debug(`Right-clicked element: ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to right-click element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    this.logger.debug(`Hovering over element: ${selector}`);
    try {
      await this.page.hover(selector);
      this.logger.debug(`Hovered over element: ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to hover over element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Get locator for advanced interactions
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Wait for specific milliseconds
   */
  async wait(ms: number): Promise<void> {
    this.logger.debug(`Waiting ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get page metadata
   */
  getMetadata(): TestMetadata {
    return this.pageMetadata;
  }

  /**
   * Add tag to page metadata
   */
  addTag(tag: string): void {
    if (!this.pageMetadata.tags.includes(tag)) {
      this.pageMetadata.tags.push(tag);
    }
  }
}

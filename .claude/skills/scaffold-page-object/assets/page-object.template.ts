/**
 * {PageName} Page Object
 * {One-line description of what this page/workflow covers}
 *
 * Every selector below MUST be confirmed against the real running app
 * (browser devtools or an automated browser check) before it is written here.
 * Never guess a data-test/data-testid value.
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class {PageName}Page extends BasePage {
  private readonly selectors = {
    // Replace every value with a selector you verified live, e.g.:
    // exampleField: '[data-test="example-field"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.addTag('@{page-tag}');
  }

  /**
   * Navigate directly to this page
   */
  async navigate(): Promise<void> {
    this.logger.info('Navigating to {PageName} page');
    await this.goto('https://www.saucedemo.com/{path}.html');
  }

  // Add page-specific methods here, using only the inherited Locator-based
  // helpers (this.click, this.fillText, this.getText, this.isVisible, ...).
  // Never use page.$, page.$$, $eval, $$eval, or waitUntil: 'networkidle'.
}

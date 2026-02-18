/**
 * Configuration management with validation
 * Handles environment variables and defaults
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import type { TestConfig } from '@/types/index';

// Load environment variables
dotenv.config();

// Zod schema for validation
const ConfigSchema = z.object({
  baseUrl: z.string().url().default('https://www.saucedemo.com'),
  apiBaseUrl: z.string().url().default('https://jsonplaceholder.typicode.com'),
  headless: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),
  browserType: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
  timeout: z.coerce.number().default(30000),
  retries: z.coerce.number().default(0),
  loglevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  mockApi: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),
});

/**
 * Configuration manager class
 * Provides type-safe access to configuration with validation
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: TestConfig;

  private constructor() {
    const rawConfig = {
      baseUrl: process.env.BASE_URL,
      apiBaseUrl: process.env.API_BASE_URL,
      headless: process.env.HEADLESS,
      browserType: process.env.BROWSER_TYPE,
      timeout: process.env.TIMEOUT,
      retries: process.env.RETRIES,
      loglevel: process.env.LOG_LEVEL,
      mockApi: process.env.MOCK_API,
    };

    try {
      this.config = ConfigSchema.parse(rawConfig);
      this.validateConfig();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Configuration validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Validate configuration consistency
   */
  private validateConfig(): void {
    try {
      new URL(this.config.baseUrl);
      new URL(this.config.apiBaseUrl);
    } catch {
      throw new Error('Invalid base URLs provided in configuration');
    }

    if (this.config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }
  }

  /**
   * Get complete configuration
   */
  public getConfig(): Readonly<TestConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get specific config value
   */
  public get<K extends keyof TestConfig>(key: K): TestConfig[K] {
    return this.config[key];
  }

  /**
   * Override configuration temporarily (for testing)
   */
  public override<K extends keyof TestConfig>(key: K, value: TestConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Reset to defaults
   */
  public reset(): void {
    ConfigManager.instance = null as any;
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

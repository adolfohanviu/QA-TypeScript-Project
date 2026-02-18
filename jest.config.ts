import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000,
  maxWorkers: process.env.HEADLESS === 'false' ? 1 : 4,
  reporters: [
    'default',
    [
      'jest-allure2',
      {
        resultsDir: 'allure-results',
        labels: {
          epic: 'epic',
          feature: 'feature',
          story: 'story',
        },
      },
    ],
  ],
};

export default config;

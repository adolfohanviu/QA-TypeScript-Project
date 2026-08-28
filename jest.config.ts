import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/api/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          target: 'ESNext',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/mocks/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000,
  maxWorkers: process.env.HEADLESS === 'false' ? 1 : 4,
  reporters: [
    'default',
  ],
};

export default config;

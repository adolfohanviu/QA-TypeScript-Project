/**
 * Type definitions for the test framework
 */

export interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin';
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  inStock: boolean;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface TestConfig {
  baseUrl: string;
  apiBaseUrl: string;
  headless: boolean;
  browserType: 'chromium' | 'firefox' | 'webkit';
  timeout: number;
  retries: number;
  loglevel: 'debug' | 'info' | 'warn' | 'error';
  mockApi: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: Record<string, unknown>;
}

export interface TestMetadata {
  name: string;
  tags: string[];
  summary?: string;
  author?: string;
  timestamp: string;
}

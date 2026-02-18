/**
 * HTTP API client with type safety and error handling
 * Uses Axios for HTTP requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { z } from 'zod';
import { config } from './config.js';
import { createLogger } from './logger.js';
import type { ApiResponse, User, Product, Order } from '@/types/index.js';

const logger = createLogger('ApiClient');

/**
 * Custom API error
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    message: string,
    public responseData?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Type-safe API client
 */
export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || config.get('apiBaseUrl');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.get('timeout'),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QA-Automation-Framework/1.0.0',
      },
      validateStatus: () => true, // Handle all status codes
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        logger.debug(`[${config.method?.toUpperCase()}] ${config.url}`);
        return config;
      },
      error => {
        logger.error('Request error', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        logger.debug(
          `[${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`,
          { responseTime: response.headers['x-response-time'] },
        );
        return response;
      },
      error => {
        logger.error('Response error', error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Make GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, config);
      this.validateResponse(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Make POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data, config);
      this.validateResponse(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Make PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data, config);
      this.validateResponse(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'PUT', endpoint);
    }
  }

  /**
   * Make DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint, config);
      this.validateResponse(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'DELETE', endpoint);
    }
  }

  /**
   * Make PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(endpoint, data, config);
      this.validateResponse(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'PATCH', endpoint);
    }
  }

  /**
   * Validate response status
   */
  private validateResponse(response: any): void {
    if (response.status >= 400) {
      throw new ApiError(
        response.status,
        response.config.url,
        `HTTP ${response.status}: ${response.statusText}`,
        response.data,
      );
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown, method: string, endpoint: string): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return new ApiError(
        axiosError.response?.status || 0,
        endpoint,
        axiosError.message,
        axiosError.response?.data,
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown error during ${method} ${endpoint}`);
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization header
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Get response headers
   */
  getHeaders(): Record<string, string> {
    return this.client.defaults.headers.common as Record<string, string>;
  }
}

// Export factory
export const createApiClient = (baseURL?: string) => new ApiClient(baseURL);

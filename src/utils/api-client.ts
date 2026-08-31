/**
 * HTTP API client with type safety and error handling
 * Uses Axios for HTTP requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { config } from './config';
import { createLogger } from './logger';

const logger = createLogger('ApiClient');

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED']);

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
  maxRetries = 2;
  backoffBaseMs = 200;

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
   * Make GET request, retried on transient failures.
   *
   * Only GET retries automatically - it's the one verb here safe to replay
   * blindly. POST/PUT/PATCH/DELETE aren't idempotent without a request-side
   * idempotency key this API doesn't have, so retrying them here could
   * double-submit; a caller that needs that has to opt in explicitly.
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    let attempt = 0;

    for (;;) {
      try {
        const response = await this.client.get<T>(endpoint, config);

        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          attempt += 1;
          logger.warn(
            `Retrying GET ${endpoint} after status ${response.status} (attempt ${attempt}/${this.maxRetries})`,
          );
          await this.backoff(attempt);
          continue;
        }

        this.validateResponse(response);
        return response.data;
      } catch (error) {
        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          attempt += 1;
          const reason = axios.isAxiosError(error) ? error.code ?? error.message : String(error);
          logger.warn(`Retrying GET ${endpoint} after ${reason} (attempt ${attempt}/${this.maxRetries})`);
          await this.backoff(attempt);
          continue;
        }

        throw this.handleError(error, 'GET', endpoint);
      }
    }
  }

  private isRetryableError(error: unknown): boolean {
    return axios.isAxiosError(error) && !!error.code && RETRYABLE_ERROR_CODES.has(error.code);
  }

  private backoff(attempt: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.backoffBaseMs * 2 ** (attempt - 1)));
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
  private validateResponse(response: AxiosResponse): void {
    if (response.status >= 400) {
      throw new ApiError(
        response.status,
        response.config.url ?? '',
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
   * Override the request timeout set at construction (e.g. for a test that
   * needs a short timeout without waiting out the default one).
   */
  setTimeout(ms: number): void {
    this.client.defaults.timeout = ms;
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

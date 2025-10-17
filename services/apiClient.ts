/**
 * API Client - HTTP Abstraction Layer
 * Follows Dependency Inversion Principle
 * Components depend on this abstraction, not on fetch directly
 */

import { apiConfig } from '../config/apiConfig';

/**
 * HTTP Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * API Client Class
 * Abstraction over fetch API following DIP
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetryAttempts: number;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.defaultTimeout = apiConfig.timeout;
    this.defaultRetryAttempts = apiConfig.retryAttempts;
  }

  /**
   * Handle response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
        error: 'An unknown error occurred'
      }));
      
      throw new ApiError(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON response
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retryAttempts = this.defaultRetryAttempts,
      headers = {},
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) or if it's the last attempt
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (attempt < retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, apiConfig.retryDelay));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }
}

/**
 * Singleton instance
 * Following Dependency Inversion - components depend on this instance
 */
export const apiClient = new ApiClient();

/**
 * Create custom instance with different config (for testing, etc.)
 */
export const createApiClient = (): ApiClient => {
  return new ApiClient();
};

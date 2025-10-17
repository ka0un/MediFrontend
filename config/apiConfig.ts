/**
 * API Configuration
 * Centralized configuration following Open/Closed Principle
 * Allows environment-based configuration without code changes
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get base URL from environment or use default
 */
const getBaseUrl = (): string => {
  // Check for environment variable (e.g., from .env file with Create React App)
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check for Vite environment variable (safely)
  try {
    // @ts-ignore - Vite's import.meta.env might not be available in all contexts
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    // import.meta not available, use default
  }
  
  // Default for development
  return 'http://localhost:8080/api';
};

/**
 * API Configuration Object
 * Can be extended without modifying existing code (OCP)
 */
export const apiConfig: ApiConfig = {
  baseUrl: getBaseUrl(),
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,      // Retry failed requests 3 times
  retryDelay: 1000,      // 1 second delay between retries
};

/**
 * Update configuration at runtime (if needed)
 */
export const updateApiConfig = (updates: Partial<ApiConfig>): void => {
  Object.assign(apiConfig, updates);
};

/**
 * Environment helper
 */
export const isDevelopment = (): boolean => {
  return apiConfig.baseUrl.includes('localhost') || apiConfig.baseUrl.includes('127.0.0.1');
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

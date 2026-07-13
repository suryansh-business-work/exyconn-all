/**
 * Centralized API Endpoints Configuration
 *
 * This file centralizes all API endpoints for the application.
 * In development, it uses localhost URLs.
 * In production, it uses the production domain URLs.
 */

// Determine if we're in development by checking the URL
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

// Base URLs for different environments
const DEV_API_BASE = 'http://localhost:4002';
const PROD_API_BASE = 'https://tools-api.exyconn.com';

// Select the appropriate base URL
export const API_BASE_URL = isLocalhost ? DEV_API_BASE : PROD_API_BASE;

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: `${API_BASE_URL}/health`,

  // Add tools-specific endpoints here
  // Example:
  // GENERATORS: `${API_BASE_URL}/api/generators`,
  // CONVERTERS: `${API_BASE_URL}/api/converters`,
  // UTILITIES: `${API_BASE_URL}/api/utilities`,
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;

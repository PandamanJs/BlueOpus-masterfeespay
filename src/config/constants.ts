/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Payment Configuration
 */
export const PAYMENT_CONFIG = {
  SERVICE_FEE_PERCENTAGE: 0.02, // 2%
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 1000000,
  CURRENCY: 'ZMW',
  CURRENCY_SYMBOL: 'K',
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'master-fees-preferences',
  PAYMENT_HISTORY: 'master-fees-payment-history',
  TUTORIAL_COMPLETED: 'hasSeenTutorial',
  APP_STATE: 'master-fees-storage',
} as const;

/**
 * Animation Durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 400,
  SLOW: 600,
  PAGE_TRANSITION: 400,
} as const;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const;

/**
 * Color Palette
 */
export const COLORS = {
  PRIMARY: '#95e36c',
  PRIMARY_DARK: '#003630',
  SUCCESS: '#4abb1a',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 13,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SEARCH_MIN_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  STUDENTS_TTL: 5 * 60 * 1000, // 5 minutes
  SERVICES_TTL: 10 * 60 * 1000, // 10 minutes
  PAYMENT_HISTORY_TTL: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_CARD_PAYMENT: true,
  ENABLE_MOBILE_MONEY: true,
  ENABLE_RECEIPT_DOWNLOAD: true,
  ENABLE_PAYMENT_HISTORY: true,
  ENABLE_TUTORIAL: true,
  ENABLE_ANALYTICS: false,
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy hh:mm a',
  SHORT: 'MM/dd/yyyy',
  TIME: 'hh:mm a',
  ISO: 'yyyy-MM-dd',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  TIMEOUT: 'Request timeout. Please try again.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  DATA_SAVED: 'Your changes have been saved.',
  DATA_LOADED: 'Data loaded successfully.',
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  SEARCH: 'search',
  DETAILS: 'details',
  SERVICES: 'services',
  HISTORY: 'history',
  RECEIPTS: 'receipts',
  PAY_FEES: 'pay-fees',
  ADD_SERVICES: 'add-services',
  CHECKOUT: 'checkout',
  PAYMENT: 'payment',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  DOWNLOAD_RECEIPT: 'download-receipt',
} as const;

/**
 * Schools Configuration
 */
export const SCHOOLS = [
  { 
    id: 1, 
    name: "Twalumbu Educational Center",
  },
] as const;

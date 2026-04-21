/**
 * ========================================
 * FORM VALIDATION UTILITIES
 * ========================================
 * 
 * Centralized validation logic for the entire app.
 * 
 * Why centralize validation?
 * - Consistency: Same rules everywhere
 * - Easier to update: Change in one place, applies everywhere
 * - Testable: Easy to unit test these pure functions
 * - Reusable: Use across different forms
 * 
 * All validators return:
 * - Empty string '' if valid
 * - Error message string if invalid
 * 
 * This makes it easy to use: if (error) { showError(error) }
 */

import { VALIDATION } from '../config/constants';
import type { ValidationError } from '../types';

/**
 * Validate Phone Number
 * 
 * Accepts: Zambian phone numbers
 * Valid Prefixes: 
 * - Airtel: 097, 077
 * - MTN: 096, 076
 * - Zamtel: 095
 * - Beeline: 098
 * 
 * Examples: "0971234567", "+260971234567", "260971234567", "971234567"
 * 
 * We strip out all non-digits first, then check the prefix and length
 */
export function validatePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned) {
    return 'Phone number is required';
  }

  // Handle +260 or 260 prefix
  let zambianRoot = cleaned;
  if (cleaned.startsWith('260') && cleaned.length > 3) {
    zambianRoot = cleaned.substring(3);
  }

  // If it starts with 0, it should be 10 digits total (e.g. 097...)
  // If it doesn't start with 0, it should be 9 digits total (e.g. 97...)
  let standardFormat = zambianRoot;
  if (!zambianRoot.startsWith('0')) {
    standardFormat = '0' + zambianRoot;
  }

  if (standardFormat.length !== 10) {
    return 'Invalid number format';
  }

  // Check Zambian Network Prefixes
  const validPrefixes = ['097', '077', '096', '076', '095', '098'];
  const prefix = standardFormat.substring(0, 3);

  if (!validPrefixes.includes(prefix)) {
    return 'Invalid number format';
  }
  
  return '';
}

/**
 * Validate User Name
 * 
 * Requirements:
 * - At least 2 characters (prevents single letter names)
 * - Max 50 characters (reasonable limit)
 * - Only letters, spaces, hyphens, and apostrophes
 * 
 * This handles names like: "John Doe", "Mary-Ann", "O'Brien"
 */
export function validateName(name: string): string {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return 'Name is required';
  }
  
  if (trimmed.length < VALIDATION.NAME_MIN_LENGTH) {
    return `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`;
  }
  
  if (trimmed.length > VALIDATION.NAME_MAX_LENGTH) {
    return `Name must not exceed ${VALIDATION.NAME_MAX_LENGTH} characters`;
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  // This prevents numbers and special characters like @ # $ etc.
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  return '';
}

/**
 * Validate Credit Card Number
 * 
 * NOTE: This is for the DEMO payment UI only!
 * We don't actually process real cards (this is a simulation app).
 * 
 * Uses the Luhn algorithm (industry standard for card validation).
 * The Luhn algorithm catches typos and basic errors, but doesn't
 * verify that the card exists or has funds.
 * 
 * Fun fact: You can test with "4532 1488 0343 6467" (valid test card)
 */
export function validateCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (!cleaned) {
    return 'Card number is required';
  }
  
  // Most cards are 13-19 digits
  if (cleaned.length < 13 || cleaned.length > 19) {
    return 'Card number must be between 13 and 19 digits';
  }
  
  // Luhn algorithm (checksum validation)
  // This is the same algorithm banks use to catch typos
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9; // Subtract 9 if doubled digit is > 9
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  // Valid card numbers have a sum divisible by 10
  if (sum % 10 !== 0) {
    return 'Invalid card number';
  }
  
  return '';
}

/**
 * Validate card expiry date (MM/YY format)
 * @param expiryDate - Expiry date string
 * @returns Error message or empty string if valid
 */
export function validateExpiryDate(expiryDate: string): string {
  const cleaned = expiryDate.replace(/\D/g, '');
  
  if (!cleaned) {
    return 'Expiry date is required';
  }
  
  if (cleaned.length !== 4) {
    return 'Expiry date must be in MM/YY format';
  }
  
  const month = parseInt(cleaned.substring(0, 2), 10);
  const year = parseInt(cleaned.substring(2, 4), 10);
  
  if (month < 1 || month > 12) {
    return 'Invalid month';
  }
  
  // Check if card is expired
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Card has expired';
  }
  
  return '';
}

/**
 * Validate CVV
 * @param cvv - CVV string
 * @returns Error message or empty string if valid
 */
export function validateCVV(cvv: string): string {
  const cleaned = cvv.replace(/\D/g, '');
  
  if (!cleaned) {
    return 'CVV is required';
  }
  
  if (cleaned.length < 3 || cleaned.length > 4) {
    return 'CVV must be 3 or 4 digits';
  }
  
  return '';
}

/**
 * Validate email address
 * @param email - Email string
 * @returns Error message or empty string if valid
 */
export function validateEmail(email: string): string {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Invalid email address';
  }
  
  return '';
}

/**
 * Validate amount
 * @param amount - Amount number or string
 * @param min - Minimum allowed amount
 * @param max - Maximum allowed amount
 * @returns Error message or empty string if valid
 */
export function validateAmount(amount: number | string, min: number = 0, max: number = Infinity): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Amount must be a valid number';
  }
  
  if (numAmount < min) {
    return `Amount must be at least ${min}`;
  }
  
  if (numAmount > max) {
    return `Amount must not exceed ${max}`;
  }
  
  return '';
}

/**
 * Validate selection (at least one item selected)
 * @param items - Array of selected items
 * @param minCount - Minimum number of items required
 * @returns Error message or empty string if valid
 */
export function validateSelection<T>(items: T[], minCount: number = 1): string {
  if (!items || items.length < minCount) {
    return `Please select at least ${minCount} item${minCount > 1 ? 's' : ''}`;
  }
  
  return '';
}

/**
 * Check if form has any errors
 * @param errors - Object containing field errors
 * @returns True if any field has an error
 */
export function hasFormErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some(error => error !== '');
}

/**
 * Check if form is complete
 * @param values - Object containing field values
 * @param requiredFields - Array of required field names
 * @returns True if all required fields have values
 */
export function isFormComplete(values: Record<string, unknown>, requiredFields: string[]): boolean {
  return requiredFields.every(field => {
    const value = values[field];
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined;
  });
}

/**
 * Validate multiple fields at once
 * @param fields - Object with field names and their validators
 * @returns Object with field names and their error messages
 */
export function validateFields(fields: Record<string, { value: unknown; validator: (value: any) => string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    errors[fieldName] = validator(value);
  }
  
  return errors;
}

/**
 * Format validation errors for display
 * @param errors - Object containing field errors
 * @returns Array of ValidationError objects
 */
export function formatValidationErrors(errors: Record<string, string>): ValidationError[] {
  return Object.entries(errors)
    .filter(([_, message]) => message !== '')
    .map(([field, message]) => ({ field, message }));
}

/**
 * Debounce Validation
 * 
 * For real-time validation (as user types).
 * 
 * Why debounce?
 * Without it, we'd validate on EVERY keystroke, which:
 * - Annoys users (showing errors too quickly)
 * - Wastes CPU (unnecessary validations)
 * - Causes UI jank (too many re-renders)
 * 
 * With debounce, we wait until user stops typing for 300ms,
 * then run the validation. Much smoother UX!
 * 
 * Example: User types "John" - we wait until they pause before
 * validating, instead of showing "J" -> "Name too short"
 */
export function debounceValidation<T>(
  validator: (value: T) => string,
  delay: number = VALIDATION.DEBOUNCE_DELAY
): (value: T, callback: (error: string) => void) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T, callback: (error: string) => void) => {
    // Cancel previous validation if user is still typing
    clearTimeout(timeoutId);
    
    // Schedule new validation
    timeoutId = setTimeout(() => {
      const error = validator(value);
      callback(error);
    }, delay);
  };
}

/**
 * Real-time input validator hook helper
 * Returns validation state and handlers
 */
export function createInputValidator<T>(
  validator: (value: T) => string,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounce?: number;
  } = {}
) {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    debounce = 0,
  } = options;
  
  return {
    validator: debounce > 0 ? debounceValidation(validator, debounce) : validator,
    validateOnChange,
    validateOnBlur,
  };
}

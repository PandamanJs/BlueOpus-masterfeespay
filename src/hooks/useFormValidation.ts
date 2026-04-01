/**
 * Form Validation Hook
 * Provides silent, real-time form validation with React hooks
 */

import { useState, useCallback, useEffect } from 'react';

interface ValidationRule<T> {
  validator: (value: T) => string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FieldState<T> {
  value: T;
  error: string;
  touched: boolean;
  isDirty: boolean;
}

interface UseFormValidationReturn<T> {
  values: Record<keyof T, any>;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isDirty: Record<keyof T, boolean>;
  isValid: boolean;
  isComplete: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, isTouched: boolean) => void;
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  setValues: (values: Partial<T>) => void;
}

/**
 * Form validation hook with silent, real-time validation
 * 
 * @param initialValues - Initial form values
 * @param validationRules - Validation rules for each field
 * @param requiredFields - Array of required field names
 * 
 * @example
 * ```tsx
 * const { values, errors, handleChange, handleBlur, isValid } = useFormValidation(
 *   { name: '', phone: '' },
 *   {
 *     name: { validator: validateName, validateOnBlur: true },
 *     phone: { validator: validatePhoneNumber, validateOnChange: true }
 *   },
 *   ['name', 'phone']
 * );
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule<T[keyof T]>>>,
  requiredFields: (keyof T)[] = []
): UseFormValidationReturn<T> {
  const [fields, setFields] = useState<Record<keyof T, FieldState<any>>>(() => {
    const initial: any = {};
    for (const key in initialValues) {
      initial[key] = {
        value: initialValues[key],
        error: '',
        touched: false,
        isDirty: false,
      };
    }
    return initial;
  });

  /**
   * Get current values
   */
  const values = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].value;
    return acc;
  }, {} as Record<keyof T, any>);

  /**
   * Get current errors
   */
  const errors = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].error;
    return acc;
  }, {} as Record<keyof T, string>);

  /**
   * Get touched state
   */
  const touched = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].touched;
    return acc;
  }, {} as Record<keyof T, boolean>);

  /**
   * Get dirty state
   */
  const isDirty = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].isDirty;
    return acc;
  }, {} as Record<keyof T, boolean>);

  /**
   * Check if form is valid (no errors)
   */
  const isValid = Object.values(fields).every(
    (field: FieldState<any>) => field.error === ''
  );

  /**
   * Check if form is complete (all required fields filled)
   */
  const isComplete = requiredFields.every(key => {
    const value = fields[key].value;
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  });

  /**
   * Validate a single field
   */
  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const rule = validationRules[field];
    if (!rule) return true;

    const value = fields[field].value;
    const error = rule.validator(value);

    setFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));

    return error === '';
  }, [fields, validationRules]);

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    let allValid = true;

    const newFields = { ...fields };

    for (const key in validationRules) {
      const rule = validationRules[key];
      if (rule) {
        const value = fields[key].value;
        const error = rule.validator(value);

        newFields[key] = {
          ...newFields[key],
          error,
          touched: true,
        };

        if (error) {
          allValid = false;
        }
      }
    }

    setFields(newFields);
    return allValid;
  }, [fields, validationRules]);

  /**
   * Set field value
   */
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        isDirty: true,
      },
    }));

    // Validate on change if configured
    const rule = validationRules[field];
    if (rule?.validateOnChange) {
      setTimeout(() => {
        const error = rule.validator(value);
        setFields(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            error,
          },
        }));
      }, 0);
    }
  }, [validationRules]);

  /**
   * Set field error
   */
  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  /**
   * Set field touched state
   */
  const setTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean) => {
    setFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: isTouched,
      },
    }));
  }, []);

  /**
   * Handle input change
   */
  const handleChange = useCallback(<K extends keyof T>(field: K) => {
    return (value: T[K]) => {
      setValue(field, value);
    };
  }, [setValue]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      setTouched(field, true);

      // Validate on blur if configured
      const rule = validationRules[field];
      if (rule?.validateOnBlur !== false) {
        validateField(field);
      }
    };
  }, [validateField, setTouched, validationRules]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    const resetFields: any = {};
    for (const key in initialValues) {
      resetFields[key] = {
        value: initialValues[key],
        error: '',
        touched: false,
        isDirty: false,
      };
    }
    setFields(resetFields);
  }, [initialValues]);

  /**
   * Set multiple values at once
   */
  const setValues = useCallback((newValues: Partial<T>) => {
    setFields(prev => {
      const updated = { ...prev };
      for (const key in newValues) {
        updated[key] = {
          ...updated[key],
          value: newValues[key],
          isDirty: true,
        };
      }
      return updated;
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isComplete,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    reset,
    setValues,
  };
}

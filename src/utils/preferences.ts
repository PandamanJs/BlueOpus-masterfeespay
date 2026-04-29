/**
 * ========================================
 * USER PREFERENCES UTILITY
 * ========================================
 * 
 * This makes the app smarter over time by learning user behavior!
 * 
 * Think of it as the app's memory. We track:
 * - Which phone number they used last (autofill next time)
 * - Which students they pay for most often (pre-select them)
 * - Which services they select frequently (show those first)
 * - Which payment method they prefer (default selection)
 * 
 * Why do this?
 * - Save users time (they don't re-enter the same info)
 * - Better UX (show most relevant options first)
 * - Feels personalized (app remembers you!)
 * 
 * Example: Parent pays for "John Doe's Tuition" every month.
 * After the first time, John's checkbox will be pre-selected!
 * 
 * Privacy note: All data stays in localStorage on the user's device.
 * Nothing is sent to a server.
 */

const STORAGE_KEYS = {
  STUDENT_FREQUENCY: 'masterfees_student_frequency',     // How many times each student was selected
  SERVICE_FREQUENCY: 'masterfees_service_frequency',     // How many times each service was selected
  LAST_PAYMENT_METHOD: 'masterfees_last_payment_method',
} as const;


/**
 * Track Student Selection
 * 
 * Every time a user selects a student, we increment their count.
 * This builds a frequency map: { "TEC001": 5, "TEC002": 12 }
 * 
 * We use this to pre-select frequently chosen students.
 */
export const incrementStudentSelection = (studentId: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STUDENT_FREQUENCY);
    const frequency: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    // Increment count for this student (or set to 1 if first time)
    frequency[studentId] = (frequency[studentId] || 0) + 1;
    
    localStorage.setItem(STORAGE_KEYS.STUDENT_FREQUENCY, JSON.stringify(frequency));
  } catch (error) {
    console.error('Error updating student frequency:', error);
  }
};

/**
 * Get Most Selected Students
 * 
 * Returns student IDs sorted by how often they're selected.
 * First ID = most frequently selected student.
 * 
 * Use this to pre-select students or show them first in lists.
 */
export const getMostSelectedStudents = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STUDENT_FREQUENCY);
    if (!stored) return [];
    
    const frequency: Record<string, number> = JSON.parse(stored);
    
    // Sort by frequency: highest count first
    // Example: If John was selected 10 times and Sarah 5 times,
    // John will appear first in the returned array
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([studentId]) => studentId);
  } catch (error) {
    console.error('Error retrieving student frequency:', error);
    return [];
  }
};

/**
 * Track Service Selection
 * 
 * Same concept as student tracking, but for services.
 * If they always pay for "Tuition + Bus", we'll remember that!
 */
export const incrementServiceSelection = (serviceId: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICE_FREQUENCY);
    const frequency: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    frequency[serviceId] = (frequency[serviceId] || 0) + 1;
    
    localStorage.setItem(STORAGE_KEYS.SERVICE_FREQUENCY, JSON.stringify(frequency));
  } catch (error) {
    console.error('Error updating service frequency:', error);
  }
};

/**
 * Get Most Selected Services
 * 
 * Returns service IDs sorted by selection frequency.
 * Useful for showing popular services first.
 */
export const getMostSelectedServices = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICE_FREQUENCY);
    if (!stored) return [];
    
    const frequency: Record<string, number> = JSON.parse(stored);
    
    // Sort by frequency (descending)
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([serviceId]) => serviceId);
  } catch (error) {
    console.error('Error retrieving service frequency:', error);
    return [];
  }
};

/**
 * Save Last Payment Method
 * 
 * Remember which payment method they used last time.
 * Pre-select it next time to save them a click.
 */
export const saveLastPaymentMethod = (method: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PAYMENT_METHOD, method);
  } catch (error) {
    console.error('Error saving payment method:', error);
  }
};

/**
 * Get Last Payment Method
 * 
 * What payment method did they use last time?
 */
export const getLastPaymentMethod = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_PAYMENT_METHOD);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    return null;
  }
};

/**
 * Clear All Preferences
 * 
 * Wipe the app's memory clean. Useful for:
 * - Testing (start with a clean slate)
 * - Logout (forget this user's data)
 * - Privacy (user wants to clear their history)
 */
export const clearAllPreferences = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing preferences:', error);
  }
};

/**
 * Get Preference Statistics
 * 
 * Quick overview of what we've learned about this user.
 * Useful for debugging or showing "personalized for you" indicators.
 * 
 * Returns:
 * - hasPhone: Do we have their phone saved?
 * - studentCount: How many different students have they paid for?
 * - serviceCount: How many different services have they used?
 * - hasPaymentMethod: Do we remember their preferred payment method?
 */
export const getPreferenceStats = () => {
  try {
    const studentFreq = localStorage.getItem(STORAGE_KEYS.STUDENT_FREQUENCY);
    const serviceFreq = localStorage.getItem(STORAGE_KEYS.SERVICE_FREQUENCY);
    
    return {
      studentCount: studentFreq ? Object.keys(JSON.parse(studentFreq)).length : 0,
      serviceCount: serviceFreq ? Object.keys(JSON.parse(serviceFreq)).length : 0,
      hasPaymentMethod: !!localStorage.getItem(STORAGE_KEYS.LAST_PAYMENT_METHOD),
    };
  } catch (error) {
    console.error('Error getting preference stats:', error);
    return {
      studentCount: 0,
      serviceCount: 0,
      hasPaymentMethod: false,
    };
  }
};

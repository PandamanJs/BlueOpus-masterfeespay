/**
 * Haptic feedback utility for PWAs.
 * handles Android (via Vibration API) and iOS (via checkbox switch trick/IOS-native feelings).
 */

// Helper to check if we're on iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// iOS workaround element for PWA haptics
let iosHapticElement: HTMLInputElement | null = null;

const initIOSHaptic = () => {
  if (typeof document === 'undefined') return;
  if (!isIOS() || iosHapticElement) return;

  iosHapticElement = document.createElement('input');
  iosHapticElement.type = 'checkbox';
  iosHapticElement.setAttribute('role', 'switch');
  iosHapticElement.style.position = 'absolute';
  iosHapticElement.style.opacity = '0';
  iosHapticElement.style.pointerEvents = 'none';
  iosHapticElement.style.width = '1px';
  iosHapticElement.style.height = '1px';
  document.body.appendChild(iosHapticElement);
};

const trigger = (androidPattern: number | number[]) => {
  try {
    // Android / Standard API
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(androidPattern);
    }

    // iOS Workaround (iOS 18+)
    if (isIOS()) {
      if (!iosHapticElement) initIOSHaptic();
      if (iosHapticElement) {
        iosHapticElement.click();
      }
    }
  } catch (e) {
    // Ignore haptic errors
  }
};

export const haptics = {
  light: () => trigger(10),
  medium: () => trigger(20),
  heavy: () => trigger(35),
  selection: () => trigger(10),
  buttonPress: () => trigger(15),
  success: () => trigger([10, 40, 10]),
  warning: () => trigger([20, 80, 20]),
  error: () => trigger([50, 100, 50, 100, 50]),
  delete: () => trigger(40),
};

// Backward compatibility or alternative name
export const hapticFeedback = (type: string = 'light') => {
  if (type in haptics) {
    (haptics as any)[type]();
  } else {
    haptics.light();
  }
};

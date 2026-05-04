/**
 * PWA Utility functions for App Badging and other native-like features
 */

/**
 * Sets the app icon badge count (supported on Android/Windows/iOS PWA)
 * @param count - Number to show on the badge (0 to clear)
 */
export const setBadge = async (count: number) => {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (error) {
      console.error('Failed to set app badge:', error);
    }
  }
};

/**
 * Triggers the native system share sheet
 * @param data - Share data object (title, text, url)
 */
export const shareApp = async (data: { title?: string; text?: string; url?: string }) => {
  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
    }
  } else {
    // Fallback: Copy URL to clipboard
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      alert('Link copied to clipboard!');
    }
  }
};

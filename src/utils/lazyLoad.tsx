/**
 * ========================================
 * LAZY LOADING UTILITY
 * ========================================
 * 
 * This handles code splitting for our app - basically breaking the app
 * into smaller chunks that load on-demand instead of all at once.
 * 
 * Why do this?
 * - Faster initial load (user sees the app quicker)
 * - Better mobile experience (less data downloaded upfront)
 * - Improved performance (only load what you need)
 * 
 * For example, why load the "Payment Success" page when the user
 * just opened the app? We'll load it when they actually make a payment.
 */

import { lazy, Suspense, ComponentType } from 'react';
import performanceMonitor from './performanceMonitor';

interface LazyLoadOptions {
  fallback?: React.ReactNode;          // What to show while loading
  componentName?: string;               // For debugging and performance tracking
  preload?: boolean;                    // Load in background ASAP?
}

/**
 * Loading Spinner Component
 * 
 * This is what users see while a page is loading.
 * We use our brand colors (#95e36c green) to keep it on-brand.
 */
function LoadingFallback() {
  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo Placeholder */}
        <div className="relative w-[80px] h-[80px]">
          <div className="absolute inset-0 rounded-full border-4 border-[#95e36c]/20" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-[#95e36c] border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          />
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] text-[#003630] mb-2">
            Loading...
          </p>
          <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-[#003630]/60">
            Please wait
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ========================================
 * MAIN LAZY LOAD FUNCTION
 * ========================================
 * 
 * This is the workhorse of our code splitting strategy.
 * 
 * How it works:
 * 1. Takes a dynamic import function (the component to load)
 * 2. Wraps it with performance tracking
 * 3. Shows a loading spinner while the component downloads
 * 4. Optionally preloads the component in the background
 * 
 * Usage:
 * const LazyPage = lazyLoadWithTracking(
 *   () => import('./MyPage'),
 *   { componentName: 'MyPage', preload: true }
 * );
 */
export function lazyLoadWithTracking<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): T {
  const { 
    fallback = <LoadingFallback />, 
    componentName = 'Unknown',
    preload = false
  } = options;

  // Wrap the import with performance tracking
  // This helps us identify slow-loading components in production
  const trackedImportFn = async () => {
    const metricName = `lazy-load-${componentName}`;
    performanceMonitor.startMetric(metricName, { componentName });
    
    try {
      const module = await importFn();
      performanceMonitor.endMetric(metricName, { success: true });
      return module;
    } catch (error) {
      performanceMonitor.endMetric(metricName, { success: false, error });
      
      // Only log errors if debug mode is on
      // We don't want to spam production console
      if (localStorage.getItem('debugPerformance') === 'true') {
        console.error(`[LazyLoad] Failed to load ${componentName}:`, error);
      }
      throw error;
    }
  };

  const LazyComponent = lazy(trackedImportFn);

  // Preload in the background if requested
  // This is useful for pages we know users will visit soon
  // For example, preload "School Details" page while user is on home page
  if (preload && typeof window !== 'undefined') {
    // Wait 100ms to not block the initial render
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail - preloading is optional, not critical
      });
    }, 100);
  }

  // Wrap everything in Suspense so React knows what to show while loading
  const WrappedComponent = (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Set display name for React DevTools
  WrappedComponent.displayName = `LazyLoad(${componentName})`;

  return WrappedComponent as unknown as T;
}

/**
 * Preload a single component manually
 * 
 * Use this when you know a user is about to navigate somewhere.
 * For example, preload the payment page when user reaches checkout.
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  importFn().catch(() => {
    // Fail silently - preloading is a performance optimization, not critical
  });
}

/**
 * Preload multiple components at once
 * 
 * Useful for preloading a whole user flow.
 * For example, when user selects a school, preload all the payment pages.
 */
export function preloadComponents(importFns: Array<() => Promise<any>>): void {
  importFns.forEach(fn => preloadComponent(fn));
}

export default lazyLoadWithTracking;

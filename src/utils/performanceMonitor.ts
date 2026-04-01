/**
 * Performance Monitoring Utility
 * Tracks page transitions, component render times, and identifies bottlenecks
 * Enterprise-ready with detailed metrics and debugging capabilities
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PageTransitionMetric {
  fromPage: string;
  toPage: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private pageTransitions: PageTransitionMetric[] = [];
  private renderTimes: Map<string, number[]> = new Map();
  private enabled: boolean = true;
  private readonly MAX_STORED_TRANSITIONS = 100;

  constructor() {
    // Only enable if explicitly requested by user
    // Performance monitoring is now opt-in to reduce console noise
    this.enabled = localStorage.getItem('enablePerformanceMonitoring') === 'true';

    if (this.enabled) {
      console.log('[PerformanceMonitor] Initialized - tracking enabled');
      this.setupPerformanceObserver();
    }
  }

  /**
   * Setup Performance Observer to track long tasks and layout shifts
   */
  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Track long tasks (tasks taking > 200ms)
      // Only log if debugging is explicitly enabled to avoid console noise
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Use 200ms threshold to only catch genuinely slow tasks
          const threshold = 200;

          if (entry.duration > threshold) {
            // Only log if user explicitly enabled detailed debugging
            const shouldLog = localStorage.getItem('debugPerformance') === 'true';

            if (shouldLog) {
              console.log('[PerformanceMonitor] Long task detected:', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: entry.startTime,
                name: entry.name,
                threshold: `${threshold}ms`
              });
            }
          }
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }

      // Track Largest Contentful Paint (only if debugging enabled)
      const lcpObserver = new PerformanceObserver((list) => {
        if (localStorage.getItem('debugPerformance') === 'true') {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('[PerformanceMonitor] LCP:', {
            duration: `${lastEntry.startTime.toFixed(2)}ms`,
            element: lastEntry.element
          });
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Track First Input Delay (only if debugging enabled)
      const fidObserver = new PerformanceObserver((list) => {
        if (localStorage.getItem('debugPerformance') === 'true') {
          for (const entry of list.getEntries()) {
            const fid = (entry as any).processingStart - entry.startTime;
            console.log('[PerformanceMonitor] FID:', `${fid.toFixed(2)}ms`);
          }
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('first-input')) {
        fidObserver.observe({ entryTypes: ['first-input'] });
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Error setting up observer:', error);
    }
  }

  /**
   * Start tracking a performance metric
   */
  startMetric(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);
    // Only log if detailed debugging is enabled
    if (localStorage.getItem('debugPerformance') === 'true') {
      console.log(`[PerformanceMonitor] Started: ${name}`, metadata);
    }
  }

  /**
   * End tracking a performance metric
   */
  endMetric(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      // Only log warnings if debugging is enabled
      if (localStorage.getItem('debugPerformance') === 'true') {
        console.warn(`[PerformanceMonitor] Metric not found: ${name}`);
      }
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    // Only log if detailed debugging is enabled
    if (localStorage.getItem('debugPerformance') === 'true') {
      console.log(`[PerformanceMonitor] Completed: ${name}`, {
        duration: `${metric.duration.toFixed(2)}ms`,
        ...metric.metadata
      });

      // Warn if duration exceeds thresholds
      if (metric.duration > 1000) {
        console.warn(`[PerformanceMonitor] ⚠️ Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
    }

    return metric.duration;
  }

  /**
   * Track page transition
   */
  trackPageTransition(fromPage: string, toPage: string) {
    if (!this.enabled) return () => { }; // Return no-op function

    const transitionKey = `transition-${fromPage}-to-${toPage}`;
    this.startMetric(transitionKey, { fromPage, toPage });

    // Return a function to end the tracking
    return () => {
      const duration = this.endMetric(transitionKey);

      if (duration !== undefined) {
        const transition: PageTransitionMetric = {
          fromPage,
          toPage,
          duration,
          timestamp: Date.now()
        };

        this.pageTransitions.push(transition);

        // Keep only last MAX_STORED_TRANSITIONS
        if (this.pageTransitions.length > this.MAX_STORED_TRANSITIONS) {
          this.pageTransitions.shift();
        }

        // Warn if transition is slow (only if debugging enabled)
        if (duration > 500 && localStorage.getItem('debugPerformance') === 'true') {
          console.warn(`[PerformanceMonitor] ⚠️ Slow page transition:`, {
            from: fromPage,
            to: toPage,
            duration: `${duration.toFixed(2)}ms`
          });
        }
      }
    };
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.enabled) return;

    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }

    const times = this.renderTimes.get(componentName)!;
    times.push(renderTime);

    // Keep only last 50 render times
    if (times.length > 50) {
      times.shift();
    }

    // Warn if render time is slow (only if debugging enabled)
    if (renderTime > 16.67 && localStorage.getItem('debugPerformance') === 'true') {
      console.warn(`[PerformanceMonitor] ⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get average render time for a component
   */
  getAverageRenderTime(componentName: string): number | null {
    const times = this.renderTimes.get(componentName);
    if (!times || times.length === 0) return null;

    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get statistics for all page transitions
   */
  getPageTransitionStats() {
    if (this.pageTransitions.length === 0) {
      return null;
    }

    const durations = this.pageTransitions.map(t => t.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return {
      totalTransitions: this.pageTransitions.length,
      averageDuration: avg,
      maxDuration: max,
      minDuration: min,
      recentTransitions: this.pageTransitions.slice(-10)
    };
  }

  /**
   * Get all render time statistics
   */
  getRenderTimeStats() {
    const stats: Record<string, { avg: number; max: number; min: number; count: number }> = {};

    this.renderTimes.forEach((times, componentName) => {
      if (times.length > 0) {
        stats[componentName] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          max: Math.max(...times),
          min: Math.min(...times),
          count: times.length
        };
      }
    });

    return stats;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    if (!this.enabled) {
      console.log('[PerformanceMonitor] Monitoring is disabled');
      return;
    }

    console.group('[PerformanceMonitor] Performance Report');

    // Page Transitions
    const transitionStats = this.getPageTransitionStats();
    if (transitionStats) {
      console.group('Page Transitions');
      console.log(`Total: ${transitionStats.totalTransitions}`);
      console.log(`Average: ${transitionStats.averageDuration.toFixed(2)}ms`);
      console.log(`Max: ${transitionStats.maxDuration.toFixed(2)}ms`);
      console.log(`Min: ${transitionStats.minDuration.toFixed(2)}ms`);
      console.table(transitionStats.recentTransitions);
      console.groupEnd();
    }

    // Component Render Times
    const renderStats = this.getRenderTimeStats();
    if (Object.keys(renderStats).length > 0) {
      console.group('Component Render Times');
      console.table(renderStats);
      console.groupEnd();
    }

    // Web Vitals
    if (typeof window !== 'undefined' && window.performance) {
      console.group('Web Vitals');
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log(`DNS Lookup: ${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`);
        console.log(`TCP Connection: ${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`);
        console.log(`Request Time: ${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`);
        console.log(`Response Time: ${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`);
        console.log(`DOM Content Loaded: ${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`);
        console.log(`Load Complete: ${(navigation.loadEventEnd - navigation.loadEventStart).toFixed(2)}ms`);
      }
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.pageTransitions = [];
    this.renderTimes.clear();
    if (localStorage.getItem('debugPerformance') === 'true') {
      console.log('[PerformanceMonitor] All metrics cleared');
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('enablePerformanceMonitoring', enabled ? 'true' : 'false');
    console.log(`[PerformanceMonitor] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
    if (enabled) {
      console.log('[PerformanceMonitor] Set debugPerformance=true to see detailed logs');
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).performanceMonitor = performanceMonitor;

  // Only show help if debugging is enabled
  if (localStorage.getItem('debugPerformance') === 'true') {
    console.log('%c[PerformanceMonitor] Detailed debugging enabled', 'color: #95e36c; font-weight: bold');
    console.log('Available commands: window.performanceMonitor.generateReport()');
  }
}

export default performanceMonitor;

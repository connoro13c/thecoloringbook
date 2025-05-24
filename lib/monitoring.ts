// Core Web Vitals and Performance Monitoring

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  timeToInteractive?: number;
  
  // Resource metrics
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  
  // User context
  url: string;
  userAgent: string;
  connectionType?: string;
  timestamp: number;
}

// Web Vitals thresholds (Google recommendations)
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

export function getRating(metricName: keyof typeof WEB_VITALS_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

export function collectPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined') {
    throw new Error('Performance metrics can only be collected in the browser');
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  // Calculate resource sizes by type
  const resourceSizes = resources.reduce(
    (acc, resource) => {
      const size = resource.transferSize || 0;
      
      if (resource.name.includes('.js')) {
        acc.jsSize += size;
      } else if (resource.name.includes('.css')) {
        acc.cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
        acc.imageSize += size;
      }
      
      acc.totalSize += size;
      return acc;
    },
    { jsSize: 0, cssSize: 0, imageSize: 0, totalSize: 0 }
  );

  // Get connection info if available
  let connectionType: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    connectionType = connection?.effectiveType;
  } catch {
    // Ignore connection detection errors
  }

  return {
    // Basic timing metrics
    pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    ttfb: navigation.responseStart - navigation.fetchStart,
    
    // Resource metrics
    ...resourceSizes,
    
    // Context
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType,
    timestamp: Date.now(),
  };
}

export function sendMetricsToAnalytics(metrics: PerformanceMetrics | WebVitalsMetric) {
  // Send to your analytics service
  // Example implementations:
  
  // Google Analytics 4
  if (typeof window !== 'undefined' && 'gtag' in window) {
    if ('name' in metrics) {
      // Web Vitals metric
      (window as any).gtag('event', metrics.name, {
        event_category: 'Web Vitals',
        value: Math.round(metrics.value),
        custom_parameter_rating: metrics.rating,
        custom_parameter_delta: Math.round(metrics.delta),
      });
    } else {
      // Performance metrics
      (window as any).gtag('event', 'performance_metrics', {
        event_category: 'Performance',
        custom_parameter_lcp: metrics.lcp,
        custom_parameter_fid: metrics.fid,
        custom_parameter_cls: metrics.cls,
        custom_parameter_page_load_time: metrics.pageLoadTime,
        custom_parameter_js_size: metrics.jsSize,
        custom_parameter_total_size: metrics.totalSize,
      });
    }
  }

  // Custom analytics endpoint
  fetch('/api/v1/analytics/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metrics),
  }).catch(error => {
    console.warn('Failed to send performance metrics:', error);
  });
}

export function initWebVitalsMonitoring() {
  if (typeof window === 'undefined') return;

  // Dynamic import of web-vitals library
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(sendMetricsToAnalytics);
    onINP(sendMetricsToAnalytics);
    onFCP(sendMetricsToAnalytics);
    onLCP(sendMetricsToAnalytics);
    onTTFB(sendMetricsToAnalytics);
  }).catch(error => {
    console.warn('Failed to load web-vitals library:', error);
  });
}

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Collect initial metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const metrics = collectPerformanceMetrics();
        sendMetricsToAnalytics(metrics);
      } catch (error) {
        console.warn('Failed to collect performance metrics:', error);
      }
    }, 0);
  });

  // Monitor long tasks (for Time to Interactive)
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            console.warn('Long task detected:', entry.duration, 'ms');
            
            // Send long task metrics
            fetch('/api/v1/analytics/long-tasks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                duration: entry.duration,
                startTime: entry.startTime,
                url: window.location.href,
                timestamp: Date.now(),
              }),
            }).catch(() => {
              // Ignore errors for monitoring
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('PerformanceObserver not supported or failed:', error);
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  // Use dynamic import for React to avoid hooks rules
  // This function should be converted to a proper hook in the component
  if (typeof window !== 'undefined') {
    initWebVitalsMonitoring();
    initPerformanceMonitoring();
  }
}

// Performance budget alerts
export function checkPerformanceBudget(metrics: PerformanceMetrics) {
  const alerts = [];

  // Check bundle size budget (200KB JS as per AGENT.md)
  if (metrics.jsSize > 200 * 1024) {
    alerts.push({
      type: 'bundle_size',
      message: `JavaScript bundle size exceeds budget: ${Math.round(metrics.jsSize / 1024)}KB > 200KB`,
      severity: 'warning',
    });
  }

  // Check total page size budget (1MB)
  if (metrics.totalSize > 1024 * 1024) {
    alerts.push({
      type: 'page_size',
      message: `Total page size exceeds budget: ${Math.round(metrics.totalSize / 1024)}KB > 1MB`,
      severity: 'error',
    });
  }

  // Check page load time (3 seconds)
  if (metrics.pageLoadTime > 3000) {
    alerts.push({
      type: 'page_load',
      message: `Page load time exceeds budget: ${Math.round(metrics.pageLoadTime)}ms > 3000ms`,
      severity: 'warning',
    });
  }

  // Check Core Web Vitals
  if (metrics.lcp && metrics.lcp > WEB_VITALS_THRESHOLDS.LCP.poor) {
    alerts.push({
      type: 'lcp',
      message: `LCP is poor: ${Math.round(metrics.lcp)}ms > ${WEB_VITALS_THRESHOLDS.LCP.poor}ms`,
      severity: 'error',
    });
  }

  if (metrics.cls && metrics.cls > WEB_VITALS_THRESHOLDS.CLS.poor) {
    alerts.push({
      type: 'cls',
      message: `CLS is poor: ${metrics.cls.toFixed(3)} > ${WEB_VITALS_THRESHOLDS.CLS.poor}`,
      severity: 'error',
    });
  }

  return alerts;
}
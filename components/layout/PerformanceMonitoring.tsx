'use client';

import { useEffect } from 'react';
import { initWebVitalsMonitoring, initPerformanceMonitoring } from '@/lib/monitoring';

export function PerformanceMonitoring() {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
      initWebVitalsMonitoring();
      initPerformanceMonitoring();
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}
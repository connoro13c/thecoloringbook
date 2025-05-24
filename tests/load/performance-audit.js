import { chromium } from 'k6/experimental/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    browser: {
      executor: 'constant-vus',
      exec: 'browserTest',
      vus: 1,
      duration: '30s',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    browser_web_vitals_lcp: ['p(95)<2500'], // Largest Contentful Paint < 2.5s
    browser_web_vitals_fid: ['p(95)<100'],  // First Input Delay < 100ms
    browser_web_vitals_cls: ['p(95)<0.1'],  // Cumulative Layout Shift < 0.1
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export async function browserTest() {
  const browser = chromium.launch({ headless: true });
  const context = browser.newContext();
  const page = context.newPage();

  try {
    // Test homepage performance
    const startTime = Date.now();
    await page.goto(BASE_URL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    check(null, {
      'Page loads within 3 seconds': () => loadTime < 3000,
    });

    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (simulated)
        vitals.fid = 0; // Will be measured during interaction

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(vitals), 2000);
      });
    });

    check(webVitals, {
      'LCP is good (< 2.5s)': (v) => v.lcp < 2500,
      'CLS is good (< 0.1)': (v) => v.cls < 0.1,
    });

    // Test upload page performance
    await page.goto(`${BASE_URL}/upload`);
    await page.waitForLoadState('networkidle');

    // Test interactive elements
    const uploadButton = page.locator('[data-testid="upload-button"]').first();
    if (await uploadButton.isVisible()) {
      const interactionStart = Date.now();
      await uploadButton.click();
      const interactionTime = Date.now() - interactionStart;
      
      check(null, {
        'Interactive elements respond quickly (< 100ms)': () => interactionTime < 100,
      });
    }

    // Measure JavaScript bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('navigation')[0];
      const jsSize = Array.from(document.scripts)
        .reduce((total, script) => {
          if (script.src) {
            const resource = performance.getEntriesByName(script.src)[0];
            return total + (resource ? resource.transferSize : 0);
          }
          return total;
        }, 0);
      
      return {
        totalSize: resources.transferSize,
        jsSize: jsSize,
      };
    });

    check(resourceSizes, {
      'Total page size < 1MB': (sizes) => sizes.totalSize < 1024 * 1024,
      'JavaScript bundle < 200KB': (sizes) => sizes.jsSize < 200 * 1024,
    });

    // Test image optimization
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const response = await page.request.get(src);
        const contentType = response.headers()['content-type'];
        
        check(null, {
          'Images are optimized format': () => 
            contentType.includes('webp') || contentType.includes('avif') || contentType.includes('svg'),
        });
      }
    }

  } finally {
    page.close();
    context.close();
    browser.close();
  }
}
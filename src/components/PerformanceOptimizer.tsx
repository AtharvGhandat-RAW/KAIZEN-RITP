import { useEffect, useCallback } from 'react';

/**
 * Performance Optimizer Component
 * Implements various performance optimizations including:
 * - Resource hints (preconnect, dns-prefetch)
 * - Font loading optimization
 * - Critical CSS inlining
 * - Core Web Vitals monitoring
 * - Service Worker registration
 * - Memory management
 */

// Core Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint (ms)
  TTFB: 800, // Time to First Byte (ms)
};

// Performance metrics collection
interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

export function PerformanceOptimizer() {
  // Collect and report Core Web Vitals
  const reportWebVitals = useCallback((metrics: PerformanceMetrics) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('📊 Web Vitals:', metrics);

      // Check against thresholds
      if (metrics.lcp && metrics.lcp > WEB_VITALS_THRESHOLDS.LCP) {
        console.warn(`⚠️ LCP is slow: ${metrics.lcp}ms (threshold: ${WEB_VITALS_THRESHOLDS.LCP}ms)`);
      }
      if (metrics.cls && metrics.cls > WEB_VITALS_THRESHOLDS.CLS) {
        console.warn(`⚠️ CLS is high: ${metrics.cls} (threshold: ${WEB_VITALS_THRESHOLDS.CLS})`);
      }
    }

    // In production, send to analytics
    if (import.meta.env.PROD && typeof navigator.sendBeacon === 'function') {
      const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
      if (analyticsEndpoint) {
        navigator.sendBeacon(analyticsEndpoint, JSON.stringify({
          type: 'web-vitals',
          metrics,
          url: window.location.href,
          timestamp: Date.now(),
        }));
      }
    }
  }, []);

  useEffect(() => {
    const metrics: PerformanceMetrics = {};

    // Add resource hints for CDN and external resources
    const resourceHints = [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
      { rel: 'dns-prefetch', href: 'https://unpkg.com' },
      { rel: 'dns-prefetch', href: 'https://cdnjs.cloudflare.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossOrigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ];

    // Add Supabase connection hints if URL is available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      resourceHints.push(
        { rel: 'dns-prefetch', href: supabaseUrl },
        { rel: 'preconnect', href: supabaseUrl, crossOrigin: 'anonymous' }
      );
    }

    resourceHints.forEach(({ rel, href, crossOrigin }) => {
      const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (crossOrigin) {
          link.crossOrigin = crossOrigin;
        }
        document.head.appendChild(link);
      }
    });

    // Optimize font loading
    if ('fonts' in document) {
      // @ts-expect-error - FontFaceSet API not fully typed
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }

    // Measure Core Web Vitals using Performance Observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            // @ts-expect-error - processingStart is available on PerformanceEventTiming
            metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            // @ts-expect-error - hadRecentInput and value are available on layout-shift entries
            if (!entry.hadRecentInput) {
              // @ts-expect-error - value property exists on LayoutShift entry type
              clsValue += entry.value;
              metrics.cls = clsValue;
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        // FCP not supported
      }

      // Time to First Byte from Navigation Timing
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        }
      } catch (e) {
        // TTFB not supported
      }
    }

    // Report metrics after page is fully loaded
    const reportMetricsOnLoad = () => {
      setTimeout(() => {
        reportWebVitals(metrics);
      }, 3000); // Wait for metrics to settle
    };

    if (document.readyState === 'complete') {
      reportMetricsOnLoad();
    } else {
      window.addEventListener('load', reportMetricsOnLoad);
    }

    // Enable GPU acceleration for animations and optimize performance
    const style = document.createElement('style');
    style.id = 'performance-optimizer-styles';
    style.textContent = `
      /* Font loading optimization */
      body {
        font-display: swap;
      }

      /* Image loading optimization with content-visibility */
      img {
        content-visibility: auto;
        contain-intrinsic-size: 300px 200px;
      }

      /* Smooth scrolling with performance */
      html {
        scroll-behavior: smooth;
      }
      
      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }
        
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* GPU acceleration for transforms */
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
      }

      /* CSS Containment for layout performance */
      .contain-layout {
        contain: layout;
      }

      .contain-paint {
        contain: paint;
      }

      .contain-strict {
        contain: strict;
      }

      /* Custom scrollbar optimization */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(220, 38, 38, 0.5);
        border-radius: 4px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(220, 38, 38, 0.7);
      }

      /* Optimize animations */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }

      /* Lazy load animations */
      [data-animate] {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
      }

      [data-animate].visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    // Intersection Observer for lazy animations
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              animationObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
      );

      // Observe elements with data-animate attribute
      document.querySelectorAll('[data-animate]').forEach((el) => {
        animationObserver.observe(el);
      });

      // Re-observe when new elements are added (for dynamically loaded content)
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              if (node.hasAttribute('data-animate')) {
                animationObserver.observe(node);
              }
              node.querySelectorAll('[data-animate]').forEach((el) => {
                animationObserver.observe(el);
              });
            }
          });
        });
      });

      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Memory management - clean up unused resources
    const cleanupMemory = () => {
      // Clear performance buffer to free memory
      if (performance.clearResourceTimings) {
        performance.clearResourceTimings();
      }
    };

    // Clean up periodically
    const memoryCleanupInterval = setInterval(cleanupMemory, 60000);

    // Register Service Worker for caching
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }

    // Cleanup
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      clearInterval(memoryCleanupInterval);
      window.removeEventListener('load', reportMetricsOnLoad);
    };
  }, [reportWebVitals]);

  return null;
}

// Export utility functions for use in other components
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  if (import.meta.env.DEV) {
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  }
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

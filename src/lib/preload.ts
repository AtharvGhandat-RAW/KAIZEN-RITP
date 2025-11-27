/**
 * Critical Resource Preloader
 * Preloads essential resources for faster page loads
 */

// Preload critical routes
export const preloadCriticalRoutes = () => {
    // Preload admin pages when user hovers on admin link
    const preloadAdmin = () => {
        import('@/pages/admin/AdminLogin');
    };

    // Preload registration when user shows intent
    const preloadRegistration = () => {
        import('@/components/RegistrationPage');
    };

    // Preload events when user shows intent  
    const preloadEvents = () => {
        import('@/components/ExploreEventsPage');
    };

    return { preloadAdmin, preloadRegistration, preloadEvents };
};

// Preload images with priority
export const preloadCriticalImages = (images: string[]) => {
    images.forEach((src) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
};

// Prefetch next page resources
export const prefetchRoute = (path: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
};

// Intersection Observer for lazy component loading
export const createLazyLoadObserver = (
    onIntersect: () => void,
    options?: IntersectionObserverInit
) => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return null;
    }

    return new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    onIntersect();
                }
            });
        },
        {
            rootMargin: '100px',
            threshold: 0.1,
            ...options,
        }
    );
};

// Request Idle Callback polyfill
export const requestIdleCallback =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: () => void, _options?: IdleRequestOptions) => setTimeout(cb, 1);

// Defer non-critical work
export const deferWork = (callback: () => void, timeout = 2000) => {
    requestIdleCallback(() => callback(), { timeout });
};

// Priority hints for resources
export const setPriorityHint = (
    element: HTMLImageElement | HTMLScriptElement | HTMLLinkElement,
    priority: 'high' | 'low' | 'auto'
) => {
    if ('fetchPriority' in element) {
        (element as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
    }
};

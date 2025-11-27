/**
 * Cache Configuration Utilities
 * Centralized caching configuration for optimal performance
 */

// Cache time constants (in milliseconds)
export const CACHE_TIME = {
    // Very short - for frequently changing data
    REALTIME: 0,
    SHORT: 30 * 1000, // 30 seconds

    // Medium - for semi-static data
    MEDIUM: 5 * 60 * 1000, // 5 minutes

    // Long - for static or rarely changing data
    LONG: 30 * 60 * 1000, // 30 minutes

    // Very long - for configuration data
    DAY: 24 * 60 * 60 * 1000, // 24 hours

    // For static assets
    WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// Stale time constants (when to consider data stale)
export const STALE_TIME = {
    REALTIME: 0,
    SHORT: 10 * 1000, // 10 seconds
    MEDIUM: 60 * 1000, // 1 minute
    LONG: 5 * 60 * 1000, // 5 minutes
    DAY: 60 * 60 * 1000, // 1 hour
} as const;

// Query key factory for consistent cache keys
export const queryKeys = {
    // Events
    events: {
        all: ['events'] as const,
        list: () => [...queryKeys.events.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
        featured: () => [...queryKeys.events.all, 'featured'] as const,
    },

    // Registrations
    registrations: {
        all: ['registrations'] as const,
        list: (filters?: Record<string, unknown>) => [...queryKeys.registrations.all, 'list', filters] as const,
        detail: (id: string) => [...queryKeys.registrations.all, 'detail', id] as const,
        stats: () => [...queryKeys.registrations.all, 'stats'] as const,
    },

    // Sponsors
    sponsors: {
        all: ['sponsors'] as const,
        list: () => [...queryKeys.sponsors.all, 'list'] as const,
    },

    // Settings
    settings: {
        all: ['settings'] as const,
        byKey: (key: string) => [...queryKeys.settings.all, key] as const,
    },

    // Queries/Contact
    queries: {
        all: ['queries'] as const,
        list: () => [...queryKeys.queries.all, 'list'] as const,
    },
} as const;

// React Query default options for different data types
export const queryOptions = {
    // For real-time data (registrations count, live stats)
    realtime: {
        staleTime: STALE_TIME.REALTIME,
        gcTime: CACHE_TIME.SHORT,
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
        refetchOnWindowFocus: true,
    },

    // For frequently updated data (registrations list)
    frequent: {
        staleTime: STALE_TIME.SHORT,
        gcTime: CACHE_TIME.MEDIUM,
        refetchOnWindowFocus: true,
    },

    // For semi-static data (events, sponsors)
    standard: {
        staleTime: STALE_TIME.MEDIUM,
        gcTime: CACHE_TIME.LONG,
        refetchOnWindowFocus: false,
    },

    // For static data (settings, configuration)
    static: {
        staleTime: STALE_TIME.LONG,
        gcTime: CACHE_TIME.DAY,
        refetchOnWindowFocus: false,
        retry: 2,
    },

    // For one-time fetches (reports, exports)
    oneTime: {
        staleTime: Infinity,
        gcTime: CACHE_TIME.SHORT,
        refetchOnWindowFocus: false,
        retry: 1,
    },
} as const;

// Local storage cache utilities
export const localCache = {
    set: <T>(key: string, value: T, ttl: number = CACHE_TIME.MEDIUM): void => {
        try {
            const item = {
                value,
                expiry: Date.now() + ttl,
            };
            localStorage.setItem(`kaizen_cache_${key}`, JSON.stringify(item));
        } catch (e) {
            console.warn('LocalStorage cache set failed:', e);
        }
    },

    get: <T>(key: string): T | null => {
        try {
            const itemStr = localStorage.getItem(`kaizen_cache_${key}`);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(`kaizen_cache_${key}`);
                return null;
            }
            return item.value as T;
        } catch (e) {
            console.warn('LocalStorage cache get failed:', e);
            return null;
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(`kaizen_cache_${key}`);
        } catch (e) {
            console.warn('LocalStorage cache remove failed:', e);
        }
    },

    clear: (): void => {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith('kaizen_cache_'))
                .forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('LocalStorage cache clear failed:', e);
        }
    },
};

// Session storage cache for temporary data
export const sessionCache = {
    set: <T>(key: string, value: T): void => {
        try {
            sessionStorage.setItem(`kaizen_session_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('SessionStorage cache set failed:', e);
        }
    },

    get: <T>(key: string): T | null => {
        try {
            const item = sessionStorage.getItem(`kaizen_session_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('SessionStorage cache get failed:', e);
            return null;
        }
    },

    remove: (key: string): void => {
        try {
            sessionStorage.removeItem(`kaizen_session_${key}`);
        } catch (e) {
            console.warn('SessionStorage cache remove failed:', e);
        }
    },
};

// Memory cache for runtime data
const memoryCache = new Map<string, { value: unknown; expiry: number }>();

export const runtimeCache = {
    set: <T>(key: string, value: T, ttl: number = CACHE_TIME.SHORT): void => {
        memoryCache.set(key, {
            value,
            expiry: Date.now() + ttl,
        });
    },

    get: <T>(key: string): T | null => {
        const item = memoryCache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            memoryCache.delete(key);
            return null;
        }
        return item.value as T;
    },

    remove: (key: string): void => {
        memoryCache.delete(key);
    },

    clear: (): void => {
        memoryCache.clear();
    },
};

// Prefetch utilities
export const prefetch = {
    // Prefetch an image
    image: (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = src;
        });
    },

    // Prefetch multiple images
    images: (srcs: string[]): Promise<void[]> => {
        return Promise.all(srcs.map(prefetch.image));
    },

    // Prefetch a URL (for navigation)
    url: (url: string): void => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },

    // Preload a URL (for critical resources)
    preload: (url: string, as: 'script' | 'style' | 'image' | 'font' | 'fetch'): void => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = as;
        if (as === 'font') {
            link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
    },
};

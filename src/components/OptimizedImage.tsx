import { ImgHTMLAttributes, useState, useRef, useEffect, memo } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean; // For above-the-fold images
  blur?: boolean; // Enable blur-up loading effect
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

// Image CDN configuration - replace with your CDN URL
const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || '';

// Supported image formats for modern browsers
const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

const supportsAVIF = () => {
  if (typeof window === 'undefined') return false;
  return false; // AVIF detection is async, default to false for simplicity
};

// Generate responsive image srcset
const generateSrcSet = (src: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1536]) => {
  // If using a CDN that supports transformations
  if (CDN_BASE_URL && src.startsWith('/')) {
    return sizes.map(size => `${CDN_BASE_URL}${src}?w=${size} ${size}w`).join(', ');
  }
  // For local images, just return the source
  return undefined;
};

// Blur placeholder generator (tiny base64 image)
const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+';

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className = '',
  priority = false,
  blur = true,
  aspectRatio,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(priority ? src : BLUR_PLACEHOLDER);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      setImgSrc(src);
      setIsLoading(false);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    // Use native lazy loading if available, with fallback to IO
    if ('loading' in HTMLImageElement.prototype) {
      setImgSrc(src);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImgSrc(src);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setImgSrc(fallbackSrc);
    setIsLoading(false);
    setHasError(true);
  };

  const srcSet = generateSrcSet(src);
  const sizes = props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading skeleton */}
      {isLoading && blur && (
        <div
          className="absolute inset-0 bg-red-900/10 animate-pulse"
          style={{
            backdropFilter: 'blur(10px)',
          }}
        />
      )}

      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        srcSet={srcSet}
        sizes={sizes}
        className={`
          ${className}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300 ease-in-out
        `}
        style={{
          contentVisibility: priority ? 'visible' : 'auto',
          containIntrinsicSize: width && height ? `${width}px ${height}px` : 'auto',
        }}
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-red-500/50 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
});

// Preload critical images
export const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

// Preload multiple images
export const preloadImages = (srcs: string[]) => {
  srcs.forEach(preloadImage);
};

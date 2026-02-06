/**
 * Image optimization utilities for LCP performance
 */

/**
 * Dynamically preload an image for LCP optimization
 */
export function preloadLCPImage(src: string, sizes?: string) {
  // Remove existing preload if any
  const existingPreload = document.querySelector(`link[rel="preload"][as="image"][href^="${src.split('?')[0]}"]`);
  if (existingPreload) {
    existingPreload.remove();
  }

  // Create new preload link
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  if (sizes) {
    link.setAttribute('sizes', sizes);
  }
  link.setAttribute('fetchpriority', 'high');
  
  // Add to head
  document.head.appendChild(link);
  
  // Return cleanup function
  return () => {
    if (link.parentNode) {
      link.remove();
    }
  };
}

/**
 * Generate optimized Cloudinary URL with responsive sizing
 */
export function getOptimizedCloudinaryUrl(
  originalUrl: string, 
  width: number, 
  height: number,
  format: 'auto' | 'webp' | 'avif' = 'auto',
  quality: number = 80
): string {
  if (!originalUrl.includes('cloudinary')) {
    return originalUrl;
  }

  return originalUrl
    .replace(/\/upload\/(v\d+\/)/, `/upload/$1w_${width},h_${height},c_scale,f_${format},q_${quality}/`);
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  originalUrl: string,
  breakpoints: { width: number; height: number }[]
): string {
  if (!originalUrl.includes('cloudinary')) {
    return '';
  }

  return breakpoints
    .map(({ width, height }) => {
      const optimizedUrl = getOptimizedCloudinaryUrl(originalUrl, width, height);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Get appropriate sizes attribute for responsive images
 */
export function getSizesString(breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop'): string {
  switch (breakpoint) {
    case 'mobile':
      return '100vw';
    case 'tablet':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 70vw';
    case 'desktop':
    default:
      return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 70vw';
  }
}

// Image URL cache to avoid redundant URL processing
const imageUrlCache = new Map<string, string>();

// Track which images have been preloaded to avoid duplicates
const preloadedImages = new Set<string>();

// Track failed image URLs to avoid retrying them
const failedImages = new Set<string>();

// Default size optimizations for different screen sizes
export type ImageSize = "thumbnail" | "small" | "medium" | "large" | "original";
export type ImageFormat = "avif" | "webp" | "jpeg" | "png" | "original";

interface ImageSizeConfig {
  width: number;
  height?: number;
  quality: number;
}

// Source interface for responsive images
export interface SourceProps {
  srcSet: string;
  media: string;
  type: string;
}

const IMAGE_SIZES: Record<ImageSize, ImageSizeConfig> = {
  thumbnail: { width: 100, quality: 70 },
  small: { width: 300, quality: 75 },
  medium: { width: 600, quality: 80 },
  large: { width: 1200, quality: 85 },
  original: { width: 0, quality: 100 }, // Original size
};

// Cache image dimensions to minimize layout shifts
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}
const imageDimensionCache = new Map<string, ImageDimensions>();

// Default fallback image paths
const FALLBACK_IMAGE = '/placeholder-product.svg';

/**
 * Validates an image URL structure
 * @param url - Image URL to validate
 * @returns boolean indicating if the URL has valid structure
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's an absolute URL (starts with http or /)
  if (url.startsWith('http') || url.startsWith('/')) {
    return true;
  }
  
  // Check if it has the expected recordId/filename format
  const parts = url.split('/');
  return parts.length === 2 && !!parts[0] && !!parts[1];
}

/**
 * Builds and caches PocketBase image URLs with optimization parameters
 * Uses the local Nginx proxy for better caching and performance
 * 
 * @param url - The partial URL (recordId/filename format)
 * @param collection - The PocketBase collection name
 * @param size - The desired image size preset
 * @param format - The desired image format (avif is recommended for best compression)
 * @returns The full image URL with optimization parameters
 */
export function getPocketBaseImageUrl(
  url: string,
  collection: string,
  size: ImageSize = "medium",
  format: ImageFormat = "avif"
): string {
  // Handle invalid or missing URLs
  if (!url) {
    return FALLBACK_IMAGE;
  }
  
  // Check if this URL previously failed to load
  if (failedImages.has(url)) {
    return FALLBACK_IMAGE;
  }
  
  // Create a cache key that includes size and format
  const cacheKey = `${url}-${size}-${format}`;
  
  // Check cache first
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }

  // Process the URL
  try {
    // Handle direct/absolute URLs
    if (url.startsWith('http') || url.startsWith('/')) {
      imageUrlCache.set(cacheKey, url);
      return url;
    }
    
    // Process PocketBase image URL
    const [recordId, filename] = url.split('/');
    if (!recordId || !filename) {
      throw new Error('Invalid image URL format');
    }

    // Use direct PocketBase URL as fallback if Nginx proxying fails
    const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host';
    
    // First try to use local Nginx proxy for better caching and performance
    let fullUrl = `/api/files/${collection}/${recordId}/${filename}`;
    
    // Add optimization parameters if not original format
    if (size !== 'original' && format !== "original") {
      const sizeConfig = IMAGE_SIZES[size];
      const params = new URLSearchParams();
      
      if (sizeConfig.width > 0) {
        params.append('thumb', `${sizeConfig.width}x0`);
      }
      
      // Add format and quality parameters
      params.append('format', format);
      params.append('quality', sizeConfig.quality.toString());
      
      // Add cache control hints to maximize caching
      const cacheVersion = '4'; // Increment this when image processing changes
      params.append('v', `${cacheVersion}-${size}-${format}`);
      
      if (params.toString()) {
        fullUrl += `?${params.toString()}`;
      }
    }
    
    // Cache for future use
    imageUrlCache.set(cacheKey, fullUrl);
    
    return fullUrl;
  } catch (error) {
    console.error('Error processing image URL:', error, url);
    // Store in failed images set
    failedImages.add(url);
    return FALLBACK_IMAGE;
  }
}

/**
 * Mark an image URL as failed to prevent further loading attempts
 * @param url - The URL that failed to load
 */
export function markImageAsFailed(url: string): void {
  failedImages.add(url);
}

/**
 * Creates sources array for responsive images
 * @param url - The image URL (recordId/filename format)
 * @param collection - The PocketBase collection name
 * @returns Array of source objects for use with picture element
 */
export function getResponsiveImageSources(url: string, collection: string): SourceProps[] {
  // Handle invalid URLs
  if (!isValidImageUrl(url)) {
    return [];
  }
  
  // Generate sources for each format and size
  const sources = [
    // WebP sources for best browser support
    {
      srcSet: getPocketBaseImageUrl(url, collection, "small", "webp"),
      media: "(max-width: 640px)",
      type: "image/webp"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "medium", "webp"),
      media: "(max-width: 1024px)",
      type: "image/webp"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "large", "webp"),
      media: "(min-width: 1025px)",
      type: "image/webp"
    },
    // JPEG fallback for maximum compatibility
    {
      srcSet: getPocketBaseImageUrl(url, collection, "small", "jpeg"),
      media: "(max-width: 640px)",
      type: "image/jpeg"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "medium", "jpeg"),
      media: "(max-width: 1024px)",
      type: "image/jpeg"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "large", "jpeg"),
      media: "(min-width: 1025px)",
      type: "image/jpeg"
    }
  ];
  
  // Filter out any fallback images
  return sources.filter(source => source.srcSet !== FALLBACK_IMAGE);
}

/**
 * Preloads critical images for improved perceived performance
 * @param urls - Array of image URLs to preload
 * @param collection - The PocketBase collection name 
 * @param size - The size to preload (default small to save bandwidth)
 * @param highPriority - Whether to use high priority preloading
 */
export function preloadImages(
  urls: string[], 
  collection: string, 
  size: ImageSize = "small",
  highPriority = false
): void {
  // Skip if running in SSR context
  if (typeof window === 'undefined') return;
  
  // Use a queue to prevent too many simultaneous requests
  const queue = [...urls];
  const maxParallelPreloads = 3; // Reduced from 4 to decrease initial network contention
  let activePreloads = 0;
  
  const processQueue = () => {
    if (queue.length === 0 || activePreloads >= maxParallelPreloads) return;
    
    const url = queue.shift();
    if (!url) return;
    
    const cacheKey = `${url}-${size}-preload`;
    
    // Skip if already preloaded
    if (preloadedImages.has(cacheKey)) {
      processQueue();
      return;
    }
    
    activePreloads++;
    
    // Use WebP as the default preload format for better browser support
    const imageUrl = getPocketBaseImageUrl(url, collection, size, "webp");
    
    if (imageUrl && imageUrl !== FALLBACK_IMAGE) {
      // Mark as preloaded to avoid duplicating work
      preloadedImages.add(cacheKey);
      
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        activePreloads--;
        processQueue();
      };
      img.onerror = () => {
        // Mark as failed to avoid retrying later
        markImageAsFailed(url);
        activePreloads--;
        processQueue();
      };
    } else {
      activePreloads--;
      processQueue();
    }
  };
  
  // Start processing the queue
  for (let i = 0; i < maxParallelPreloads; i++) {
    processQueue();
  }
}

/**
 * Preloads the critical first visible images on a page
 * @param productIds - Array of product IDs visible in the initial viewport
 * @param collection - The PocketBase collection name
 */
export function preloadCriticalImages(productIds: string[], collection: string): void {
  // Skip if running in SSR context
  if (typeof window === 'undefined') return;
  
  // Create a preload link for each critical image - limit to first 2 to reduce initial load
  const criticalIds = productIds.slice(0, 2);
  
  criticalIds.forEach((id, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    
    // Use webp for broader browser support
    link.href = getPocketBaseImageUrl(id, collection, "medium", "webp");
    link.type = 'image/webp';
    
    // Only set the highest priority on the very first image
    if (index === 0) {
      link.setAttribute('fetchpriority', 'high');
    }
    
    document.head.appendChild(link);
  });
  
  // Queue the rest for lazy loading if needed
  if (productIds.length > 2) {
    const nonCritical = productIds.slice(2);
    // Use requestIdleCallback to load these during browser idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadImages(nonCritical, collection, 'small', false);
      });
    } else {
      // Fallback with setTimeout
      setTimeout(() => {
        preloadImages(nonCritical, collection, 'small', false);
      }, 1000);
    }
  }
}

/**
 * Clears image URL cache
 */
export function clearImageCache(): void {
  imageUrlCache.clear();
  preloadedImages.clear();
  imageDimensionCache.clear();
}

/**
 * Set maximum cache size to prevent memory issues
 */
export function limitCacheSize(maxSize: number = 100): void {
  if (imageUrlCache.size > maxSize) {
    // Remove oldest entries (first items in the map)
    const entriesToRemove = imageUrlCache.size - maxSize;
    const keysToRemove = Array.from(imageUrlCache.keys()).slice(0, entriesToRemove);
    keysToRemove.forEach(key => imageUrlCache.delete(key));
  }
  
  // Also limit preloaded images cache
  if (preloadedImages.size > maxSize) {
    const entriesToRemove = preloadedImages.size - maxSize;
    const keysToRemove = Array.from(preloadedImages).slice(0, entriesToRemove);
    keysToRemove.forEach(key => preloadedImages.delete(key));
  }
  
  // Limit dimension cache
  if (imageDimensionCache.size > maxSize) {
    const entriesToRemove = imageDimensionCache.size - maxSize;
    const keysToRemove = Array.from(imageDimensionCache.keys()).slice(0, entriesToRemove);
    keysToRemove.forEach(key => imageDimensionCache.delete(key));
  }
} 
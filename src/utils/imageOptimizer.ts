// Image URL cache to avoid redundant URL processing
const imageUrlCache = new Map<string, string>();

// Track which images have been preloaded to avoid duplicates
const preloadedImages = new Set<string>();

// Default size optimizations for different screen sizes
export type ImageSize = "thumbnail" | "small" | "medium" | "large" | "original";
export type ImageFormat = "avif" | "webp" | "jpeg" | "png" | "original";

interface ImageSizeConfig {
  width: number;
  height?: number;
  quality: number;
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

/**
 * Builds and caches PocketBase image URLs with optimization parameters
 * @param url - The partial URL (recordId/filename format)
 * @param collection - The PocketBase collection name
 * @param size - The desired image size preset
 * @param format - The desired image format (avif is recommended for best compression)
 * @param baseUrl - The base URL for the PocketBase instance
 * @returns The full image URL with optimization parameters
 */
export function getPocketBaseImageUrl(
  url: string,
  collection: string,
  size: ImageSize = "medium",
  format: ImageFormat = "avif",
  baseUrl: string = 'https://backend-pocketbase.7za6uc.easypanel.host'
): string {
  // Create a cache key that includes size and format
  const cacheKey = `${url}-${size}-${format}`;
  
  // Check cache first
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }

  // Process the URL
  try {
    const [recordId, filename] = url.split('/');
    if (!recordId || !filename) {
      throw new Error('Invalid image URL format');
    }

    // Build base URL
    let fullUrl = `${baseUrl.replace(/\/$/, '')}/api/files/${collection}/${recordId}/${filename}`;
    
    // Add optimization parameters if not original format
    if (format !== "original") {
      const sizeConfig = IMAGE_SIZES[size];
      const params = new URLSearchParams();
      
      if (sizeConfig.width > 0) {
        params.append('thumb', `${sizeConfig.width}x0`);
      }
      
      // Add format and quality parameters
      params.append('format', format);
      params.append('quality', sizeConfig.quality.toString());
      
      // Add cache control hints to maximize caching
      const cacheVersion = '2'; // Increment this when image processing changes
      params.append('v', `${cacheVersion}-${size}-${format}`);
      
      if (params.toString()) {
        fullUrl += `?${params.toString()}`;
      }
    }
    
    // Cache for future use
    imageUrlCache.set(cacheKey, fullUrl);
    
    return fullUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return '';
  }
}

/**
 * Creates sources array for responsive images
 * @param url - The image URL (recordId/filename format)
 * @param collection - The PocketBase collection name
 * @returns Array of source objects for use with picture element
 */
export function getResponsiveImageSources(url: string, collection: string) {
  return [
    // AVIF sources for browsers with best support (smallest file size)
    {
      srcSet: getPocketBaseImageUrl(url, collection, "small", "avif"),
      media: "(max-width: 640px)",
      type: "image/avif"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "medium", "avif"),
      media: "(max-width: 1024px)",
      type: "image/avif"
    },
    {
      srcSet: getPocketBaseImageUrl(url, collection, "large", "avif"),
      media: "(min-width: 1025px)",
      type: "image/avif"
    },
    // WebP sources for browsers that don't support AVIF
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
    // Fallback JPEG sources for older browsers
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
    
    // For better browser support, use WebP as the default preload format
    // AVIF support is still not universal
    const imageUrl = getPocketBaseImageUrl(url, collection, size, "webp");
    
    if (imageUrl) {
      // For high priority, create a preload link for the browser to discover it
      if (highPriority) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        link.type = 'image/webp';
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      }
      
      // Use requestIdleCallback for non-critical images
      if (!highPriority && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const img = new Image();
          img.onload = img.onerror = () => {
            activePreloads--;
            processQueue();
          };
          img.src = imageUrl;
          preloadedImages.add(cacheKey);
        });
      } else {
        // Fallback or high priority images
        const img = new Image();
        img.onload = img.onerror = () => {
          activePreloads--;
          processQueue();
        };
        img.src = imageUrl;
        preloadedImages.add(cacheKey);
      }
    } else {
      activePreloads--;
      processQueue();
    }
  };
  
  // Start initial batch of preloads
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
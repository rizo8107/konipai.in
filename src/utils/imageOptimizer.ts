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
 * @param format - The desired image format (webp is recommended)
 * @param baseUrl - The base URL for the PocketBase instance
 * @returns The full image URL with optimization parameters
 */
export function getPocketBaseImageUrl(
  url: string,
  collection: string,
  size: ImageSize = "medium",
  format: ImageFormat = "webp",
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
      const cacheVersion = '1'; // Increment this when image processing changes
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
    // WebP sources for modern browsers (preferred format)
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
    // Fallback JPEG sources for browsers that don't support WebP
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
  // Use a queue to prevent too many simultaneous requests
  const queue = [...urls];
  const maxParallelPreloads = 4;
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
    const imageUrl = getPocketBaseImageUrl(url, collection, size, "webp");
    
    if (imageUrl) {
      const img = new Image();
      
      // Listen for load and error events to continue the queue
      const continueQueue = () => {
        activePreloads--;
        processQueue();
      };
      
      img.onload = continueQueue;
      img.onerror = continueQueue;
      
      // For critical above-the-fold images, add a preload link
      if (highPriority) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        link.type = 'image/webp';
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      }
      
      // Start loading the image
      img.src = imageUrl;
      preloadedImages.add(cacheKey);
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
  // Create a preload link for each critical image - limit to first 4 to avoid too many requests
  const criticalIds = productIds.slice(0, 4);
  
  criticalIds.forEach((id, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getPocketBaseImageUrl(id, collection, "medium", "webp");
    link.type = 'image/webp';
    
    // Only set the highest priority on the very first image
    if (index === 0) {
      link.setAttribute('fetchpriority', 'high');
    }
    
    document.head.appendChild(link);
  });
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
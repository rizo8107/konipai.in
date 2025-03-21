// Image URL cache to avoid redundant URL processing
const imageUrlCache = new Map<string, string>();

// Track which images have been preloaded to avoid duplicates
const preloadedImages = new Set<string>();

// Default size optimizations for different screen sizes
export type ImageSize = "thumbnail" | "small" | "medium" | "large" | "original";
export type ImageFormat = "webp" | "jpeg" | "png" | "original";

interface ImageSizeConfig {
  width: number;
  quality: number;
}

const IMAGE_SIZES: Record<ImageSize, ImageSizeConfig> = {
  thumbnail: { width: 100, quality: 75 },
  small: { width: 300, quality: 80 },
  medium: { width: 600, quality: 85 },
  large: { width: 1200, quality: 90 },
  original: { width: 0, quality: 100 }, // Original size
};

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
    let fullUrl = `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
    
    // Add optimization parameters if not original format
    if (format !== "original") {
      const sizeConfig = IMAGE_SIZES[size];
      const params = new URLSearchParams();
      
      if (sizeConfig.width > 0) {
        params.append('thumb', `${sizeConfig.width}x0`);
      }
      
      params.append('format', format);
      params.append('quality', sizeConfig.quality.toString());
      
      // Add cache-busting parameter based on size and format to ensure proper caching
      params.append('v', `${size}-${format}`);
      
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
  urls.forEach(url => {
    const cacheKey = `${url}-${size}-preload`;
    
    // Skip if already preloaded
    if (preloadedImages.has(cacheKey)) {
      return;
    }
    
    const imageUrl = getPocketBaseImageUrl(url, collection, size, "webp");
    if (imageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      link.type = 'image/webp';
      
      // Set high priority for critical images
      if (highPriority) {
        link.setAttribute('fetchpriority', 'high');
      }
      
      document.head.appendChild(link);
      preloadedImages.add(cacheKey);
    }
  });
}

/**
 * Preloads the critical first visible images on a page
 * @param productIds - Array of product IDs visible in the initial viewport
 * @param collection - The PocketBase collection name
 */
export function preloadCriticalImages(productIds: string[], collection: string): void {
  // Create a preload link for each critical image
  productIds.forEach(id => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = `${window.location.origin}/api/image-proxy?id=${id}&size=medium&format=webp`;
    link.type = 'image/webp';
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  });
}

/**
 * Clears image URL cache
 */
export function clearImageCache(): void {
  imageUrlCache.clear();
  preloadedImages.clear();
}

// Set maximum cache size to prevent memory issues
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
} 
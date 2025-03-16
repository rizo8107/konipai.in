// Image URL cache to avoid redundant URL processing
const imageUrlCache = new Map<string, string>();

/**
 * Builds and caches PocketBase image URLs
 * @param url - The partial URL (recordId/filename format)
 * @param collection - The PocketBase collection name
 * @param baseUrl - The base URL for the PocketBase instance
 * @returns The full image URL
 */
export function getPocketBaseImageUrl(
  url: string,
  collection: string,
  baseUrl: string = 'https://backend-pocketbase.7za6uc.easypanel.host'
): string {
  // Check cache first
  if (imageUrlCache.has(url)) {
    return imageUrlCache.get(url)!;
  }

  // Process the URL
  try {
    const [recordId, filename] = url.split('/');
    if (!recordId || !filename) {
      throw new Error('Invalid image URL format');
    }

    // Build full URL
    const fullUrl = `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
    
    // Cache for future use
    imageUrlCache.set(url, fullUrl);
    
    return fullUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return '';
  }
}

/**
 * Preloads images to improve perceived performance
 * @param urls - Array of image URLs to preload
 * @param collection - The PocketBase collection name
 */
export function preloadImages(urls: string[], collection: string): void {
  urls.forEach(url => {
    const imageUrl = getPocketBaseImageUrl(url, collection);
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
    }
  });
}

/**
 * Clears image URL cache
 */
export function clearImageCache(): void {
  imageUrlCache.clear();
}

// Set maximum cache size to prevent memory issues
export function limitCacheSize(maxSize: number = 100): void {
  if (imageUrlCache.size > maxSize) {
    // Remove oldest entries (first items in the map)
    const entriesToRemove = imageUrlCache.size - maxSize;
    const keysToRemove = Array.from(imageUrlCache.keys()).slice(0, entriesToRemove);
    keysToRemove.forEach(key => imageUrlCache.delete(key));
  }
} 
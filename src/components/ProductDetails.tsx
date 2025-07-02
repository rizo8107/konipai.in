import { Check, Play, Image as ImageIcon } from 'lucide-react';
import { type Product } from '@/lib/pocketbase';
import { useState, useEffect } from 'react';
import { VideoPlayerFallback } from '@/components/ui/video-player-fallback';
import { VideoPlayer } from '@/components/ui/video-player';
import { pocketbase, Collections } from '@/lib/pocketbase';
import { getPocketBaseImageUrl } from '@/utils/imageOptimizer';

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string | undefined): string | null => {
  if (!url) return null;
  
  // Match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  return null;
};

// Helper function to check if URL is a YouTube video
const isYouTubeUrl = (url: string | undefined): boolean => {
  return !!getYouTubeVideoId(url);
};

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (url: string | undefined): string => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return '';
};

// Helper function to check if URL is a direct video file
const isVideoFileUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  // Check for common video file extensions
  const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.avi', '.wmv', '.m4v', '.mpg', '.mpeg'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

// Helper function to check if URL is a PocketBase file
const isPocketBaseFileUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  // Check if it's a PocketBase file URL pattern (contains /api/files/)
  return url.includes('/api/files/') || (url && !url.startsWith('http'));
};

// Helper function to extract record ID and filename from PocketBase URL
const extractPocketBaseFileInfo = (url: string | undefined): { recordId: string, filename: string } | null => {
  if (!url) return null;
  
  // If it's a full URL with /api/files/ pattern
  if (url.includes('/api/files/')) {
    const parts = url.split('/api/files/')[1].split('/');
    if (parts.length >= 3) {
      const collection = parts[0];
      const recordId = parts[1];
      const filename = parts.slice(2).join('/');
      return { recordId, filename };
    }
  } 
  // If it's a relative URL in format recordId/filename
  else if (url.includes('/')) {
    const [recordId, ...filenameParts] = url.split('/');
    const filename = filenameParts.join('/');
    if (recordId && filename) {
      return { recordId, filename };
    }
  }
  
  return null;
};

// Helper function to get the full PocketBase file URL
const getPocketBaseFileUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) {
    return url;
  }
  
  // Otherwise, construct the full URL using PocketBase baseUrl
  const baseUrl = pocketbase.baseUrl.endsWith('/') 
    ? pocketbase.baseUrl.slice(0, -1) 
    : pocketbase.baseUrl;
    
  return `${baseUrl}/api/files/${Collections.PRODUCTS}/${url}`;
};

interface ProductDetailsProps {
  product: Product;
}

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Generate or fetch thumbnail for the video
  useEffect(() => {
    if (!product?.videoUrl) return;
    
    setThumbnailLoading(true);
    setThumbnailError(false);
    
    // First priority: Check if there's a dedicated videoThumbnail field
    if (product.videoThumbnail) {
      try {
        // Get the file extension to determine format
        const fileExtension = product.videoThumbnail.split('.').pop()?.toLowerCase() || '';
        let format: 'webp' | 'jpeg' | 'png' | 'avif' = 'webp';
        
        // Set format based on file extension
        if (fileExtension === 'png') format = 'png';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') format = 'jpeg';
        else if (fileExtension === 'avif') format = 'avif';
        
        // Use the same approach as the video URL construction
        // First check if the videoThumbnail is already a full URL
        if (product.videoThumbnail.startsWith('http')) {
          setThumbnailUrl(product.videoThumbnail);
          console.log('Using full URL video thumbnail:', product.videoThumbnail);
        } else {
          // Otherwise construct the URL using the same pattern as getPocketBaseFileUrl
          const baseUrl = pocketbase.baseUrl.endsWith('/') 
            ? pocketbase.baseUrl.slice(0, -1) 
            : pocketbase.baseUrl;
          
          // Use the direct URL approach that's known to work
          const videoThumbnail = `${baseUrl}/api/files/${Collections.PRODUCTS}/${product.id}/${product.videoThumbnail}`;
          setThumbnailUrl(videoThumbnail);
          console.log('Using constructed video thumbnail URL:', videoThumbnail);
        }
        
        setThumbnailLoading(false);
      } catch (error) {
        console.error('Error using dedicated video thumbnail:', error);
        setThumbnailError(true);
        setThumbnailLoading(false);
      }
    }
    // Second priority: For YouTube videos, get the thumbnail from YouTube
    else if (isYouTubeUrl(product.videoUrl)) {
      const videoId = getYouTubeVideoId(product.videoUrl);
      if (videoId) {
        // YouTube provides several thumbnail options
        setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        setThumbnailLoading(false);
      }
    } 
    // Third priority: For PocketBase videos
    else if (isPocketBaseFileUrl(product.videoUrl)) {
      // If product has images, use the first one as thumbnail
      if (product.images && product.images.length > 0) {
        try {
          // Use the optimized image utility to get a proper thumbnail
          const thumbnailImage = getPocketBaseImageUrl(
            product.images[0], 
            Collections.PRODUCTS, 
            "medium", 
            "webp"
          );
          setThumbnailUrl(thumbnailImage);
          setThumbnailLoading(false);
          console.log('Using product image as video thumbnail:', thumbnailImage);
        } catch (error) {
          console.error('Error generating thumbnail from product image:', error);
          setThumbnailError(true);
          setThumbnailLoading(false);
        }
      } else {
        // Fallback to direct URL
        setThumbnailUrl(getPocketBaseFileUrl(product.videoUrl));
        console.log('Using direct video URL as thumbnail:', product.videoUrl);
        setThumbnailLoading(false);
      }
    }
    // For other videos, just use a generic thumbnail
    else {
      setThumbnailUrl(null);
      setThumbnailLoading(false);
    }
  }, [product?.videoUrl, product?.images]);

  if (!product) {
    return null;
  }

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };
  
  const handleThumbnailError = () => {
    setThumbnailError(true);
  };

  return (
    <div className="mt-16 space-y-8">
      {/* Product Video */}
      {product.videoUrl && (
        <div className="bg-gray-50 rounded-lg p-6 mb-24">
          <h3 className="text-lg font-semibold mb-4">Product Video</h3>
          <div className="relative w-full bg-gray-100 rounded-lg overflow-visible aspect-video">
            {!isVideoPlaying ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                {thumbnailLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading thumbnail...</p>
                  </div>
                ) : thumbnailError || !thumbnailUrl ? (
                  <div className="flex flex-col items-center justify-center space-y-2 p-4">
                    <ImageIcon size={48} className="text-gray-400" />
                    <p className="text-sm text-gray-500 text-center">Product Video</p>
                  </div>
                ) : (
                  <img 
                    src={thumbnailUrl} 
                    alt="Video thumbnail" 
                    className="w-full h-full object-cover"
                    onError={() => setThumbnailError(true)}
                  />
                )}
                
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                  aria-label="Play video"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center">
                    <Play size={24} className="text-primary ml-1 sm:ml-1.5 sm:size-[32px]" />
                  </div>
                </button>
              </div>
            ) : (
              isYouTubeUrl(product.videoUrl) ? (
                <iframe
                  src={`${getYouTubeEmbedUrl(product.videoUrl)}${isVideoPlaying ? '?autoplay=1' : ''}`}
                  title="YouTube video player"
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : isPocketBaseFileUrl(product.videoUrl) || isVideoFileUrl(product.videoUrl) ? (
                <div className="z-[90] relative" style={{ position: 'relative', zIndex: 90 }}>
                  <VideoPlayer 
                    src={isPocketBaseFileUrl(product.videoUrl) ? getPocketBaseFileUrl(product.videoUrl) : product.videoUrl}
                    onClose={() => setIsVideoPlaying(false)}
                  />
                </div>
              ) : (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <iframe
                    src={`${product.videoUrl}${product.videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                    title="Product video"
                    className="w-full h-full"
                    style={{ maxHeight: 'calc(100% - 60px)', aspectRatio: 'auto' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )
            )}
          </div>
          {/* Video description removed */}
        </div>
      )}
      {/* Product Specifications */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Material</span>
              <span className="font-medium">{product.specifications?.material || product.material}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-medium">{product.specifications?.dimensions || product.dimensions}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium">{product.specifications?.weight || 'Standard'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">{product.specifications?.capacity || 'Standard'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Style</span>
              <span className="font-medium">{product.specifications?.style || 'Modern'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Pattern</span>
              <span className="font-medium">{product.specifications?.pattern || 'Solid'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Closure</span>
              <span className="font-medium">{product.specifications?.closure || 'Standard'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Water Resistant</span>
              <span className="font-medium">{product.specifications?.waterResistant ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Care Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Care Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Cleaning</h4>
            <ul className="space-y-2 text-muted-foreground">
              {(product.care_instructions?.cleaning || product.care || [
                'Spot clean with mild soap and water',
                'Do not machine wash',
                'Air dry in shade',
                'Do not bleach'
              ]).map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 text-green-600 shrink-0" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Storage</h4>
            <ul className="space-y-2 text-muted-foreground">
              {(product.care_instructions?.storage || [
                'Store in a cool, dry place',
                'Avoid direct sunlight',
                'Keep away from moisture',
                'Use dust bag when not in use'
              ]).map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 text-green-600 shrink-0" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Features and Benefits */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Features & Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Key Features</h4>
            <ul className="space-y-3">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Recommended Use</h4>
            <ul className="space-y-2 text-muted-foreground">
              {(product.usage_guidelines?.recommended_use || [
                'Distribute weight evenly for better durability',
                'Clean spills immediately to prevent staining',
                'Use internal pockets for organization',
                'Avoid overloading beyond capacity'
              ]).map((guideline, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 text-green-600 shrink-0" />
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Pro Tips</h4>
            <ul className="space-y-2 text-muted-foreground">
              {(product.usage_guidelines?.pro_tips || [
                'Use bag hooks when placing on floors',
                'Rotate usage to maintain shape',
                'Store stuffed to maintain structure',
                'Apply water repellent spray for protection'
              ]).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 text-green-600 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 
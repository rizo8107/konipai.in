import { Check, Play } from 'lucide-react';
import { type Product } from '@/lib/pocketbase';
import { useState } from 'react';
import { VideoPlayerFallback } from '@/components/ui/video-player-fallback';

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

interface ProductDetailsProps {
  product: Product;
}

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!product) {
    return null;
  }

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  return (
    <div className="mt-16 space-y-8">
      {/* Product Video */}
      {product.videoUrl && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Product Video</h3>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
            {!isVideoPlaying ? (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={handleVideoPlay}
              >
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-white text-lg">Product Video</span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center group-hover:bg-opacity-100 transition-all">
                    <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                  </div>
                </div>
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
              ) : isVideoFileUrl(product.videoUrl) ? (
                <div className="absolute top-0 left-0 w-full h-full">
                  <VideoPlayerFallback 
                    videoUrl={product.videoUrl} 
                  />
                </div>
              ) : (
                <iframe
                  src={`${product.videoUrl}${product.videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  title="Product video"
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
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
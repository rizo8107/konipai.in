import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { getSliderImages, SliderImage, Collections } from '@/lib/pocketbase';
import { getPocketBaseImageUrl, preloadImages } from '@/utils/imageOptimizer';

const Hero = () => {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const nextImageIndexRef = useRef((currentImageIndex + 1) % Math.max(1, sliderImages.length));
  
  useEffect(() => {
    const controller = new AbortController();

    const fetchSliderImages = async () => {
      try {
        setLoading(true);
        const images = await getSliderImages(controller.signal);
        setSliderImages(images);
        setLoading(false);
      } catch (error) {
        // Only log error if it's not an abort error
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Error fetching slider images:', error);
        }
      }
    };
    
    fetchSliderImages();
    
    return () => {
      controller.abort();
    };
  }, []);
  
  // Preload next image when current image changes
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    
    // Calculate next image index
    const nextIndex = (currentImageIndex + 1) % sliderImages.length;
    nextImageIndexRef.current = nextIndex;
    
    // Preload next image
    if (sliderImages[nextIndex]?.image) {
      const img = new Image();
      // Extract image ID and filename for the optimization
      const imageUrl = sliderImages[nextIndex].image;
      const urlParts = imageUrl.split('/');
      if (urlParts.length >= 2) {
        const imageId = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];
        const optimizedUrl = getPocketBaseImageUrl(`${imageId}/${fileName}`, Collections.SLIDER_IMAGES, "large", "webp");
        img.src = optimizedUrl;
      }
    }
  }, [currentImageIndex, sliderImages]);
  
  // Initial preloading of all slider images as small thumbnails
  useEffect(() => {
    if (sliderImages.length > 0 && !imagesPreloaded) {
      try {
        // Extract image URLs in the right format for the preloader
        const imageUrls = sliderImages.map(slide => {
          const urlParts = slide.image.split('/');
          if (urlParts.length >= 2) {
            const imageId = urlParts[urlParts.length - 2];
            const fileName = urlParts[urlParts.length - 1];
            return `${imageId}/${fileName}`;
          }
          return '';
        }).filter(Boolean);
        
        // Preload current image as high priority
        if (imageUrls[currentImageIndex]) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          const optimizedUrl = getPocketBaseImageUrl(imageUrls[currentImageIndex], Collections.SLIDER_IMAGES, "large", "webp");
          link.href = optimizedUrl;
          link.type = 'image/webp';
          link.setAttribute('fetchpriority', 'high');
          document.head.appendChild(link);
        }
        
        // Preload other images as low priority
        preloadImages(imageUrls, Collections.SLIDER_IMAGES, "small", false);
        
        setImagesPreloaded(true);
      } catch (error) {
        console.error('Error preloading slider images:', error);
      }
    }
  }, [sliderImages, imagesPreloaded, currentImageIndex]);
  
  useEffect(() => {
    if (sliderImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [sliderImages]);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  const goToPrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? sliderImages.length - 1 : prevIndex - 1
    );
  };

  const goToNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % sliderImages.length
    );
  };

  // Helper function to determine if a link is external
  const isExternalLink = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSlideClick = (slide: SliderImage) => {
    if (slide.link) {
      if (isExternalLink(slide.link)) {
        window.open(slide.link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = slide.link;
      }
    }
  };
  
  // Helper to get optimized image URL
  const getOptimizedImageUrl = (imageUrl: string, size: "small" | "medium" | "large" = "large") => {
    try {
      const urlParts = imageUrl.split('/');
      if (urlParts.length >= 2) {
        const imageId = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];
        return getPocketBaseImageUrl(`${imageId}/${fileName}`, Collections.SLIDER_IMAGES, size, "webp");
      }
      return imageUrl;
    } catch {
      return imageUrl;
    }
  };

  if (loading) {
    return (
      <section className="relative w-full h-[400px] md:h-[600px] lg:h-[650px] flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#219898]" />
      </section>
    );
  }

  if (sliderImages.length === 0) {
    return (
      <section className="relative w-full h-[400px] md:h-[600px] lg:h-[650px] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No slider images available</p>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[400px] md:h-[600px] lg:h-[650px] overflow-hidden">
      {/* Image Slider */}
      <div className="absolute inset-0 w-full h-full">
        {sliderImages.map((slide, index) => {
          const isCurrentImage = currentImageIndex === index;
          const isNextImage = nextImageIndexRef.current === index;
          // Only render current and next images to save memory
          if (!isCurrentImage && !isNextImage) return null;
          
          // Get both large and small versions of the image
          const smallImageUrl = getOptimizedImageUrl(slide.image, "medium");
          const largeImageUrl = getOptimizedImageUrl(slide.image, "large");
          
          return (
            <div 
              key={slide.id}
              className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
                isCurrentImage ? 'opacity-100 z-10' : 'opacity-0 z-0'
              } cursor-pointer`}
              onClick={() => handleSlideClick(slide)}
            >
              {/* Small blurry image that loads immediately for blur-up effect - with reduced blur and faster transition */}
              {isCurrentImage && (
                <div className="absolute inset-0 transition-opacity duration-300" 
                     style={{ opacity: largeImageUrl ? 0 : 0.5 }}>
                  <img 
                    src={smallImageUrl}
                    alt={slide.title || 'Slider image'}
                    className="w-full h-full object-cover"
                    loading="eager"
                    width="1200"
                    height="600"
                  />
                </div>
              )}
              
              {/* High quality image that loads after */}
              <img 
                src={largeImageUrl}
                alt={slide.title || 'Slider image'}
                className="w-full h-full object-cover"
                loading={isCurrentImage ? "eager" : "lazy"}
                width="1200"
                height="600"
                onLoad={(e) => {
                  // Once the high quality image loads, fade out the blurry one
                  const target = e.target as HTMLImageElement;
                  target.parentElement?.previousElementSibling?.classList.add('opacity-0');
                }}
              />
              
              {/* Optional overlay for dark images */}
              {slide.needsOverlay && (
                <div className="absolute inset-0 bg-black/10" />
              )}
              
              {/* Content */}
              {slide.title && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <div className="max-w-4xl space-y-4">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-lg md:text-xl text-white/90 drop-shadow">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Navigation Arrows */}
      {sliderImages.length > 1 && (
        <>
          <button
            onClick={goToPrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Dots */}
      {sliderImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImageIndex === index
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Hero;

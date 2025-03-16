import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSliderImages, SliderImage } from '@/lib/pocketbase';

const Hero = () => {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
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
  
  useEffect(() => {
    if (sliderImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [sliderImages]);

  const goToSlide = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const goToPrevSlide = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? sliderImages.length - 1 : prevIndex - 1
    );
  }, [sliderImages.length]);

  const goToNextSlide = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % sliderImages.length
    );
  }, [sliderImages.length]);

  // Helper function to determine if a link is external
  const isExternalLink = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSlideClick = useCallback((slide: SliderImage) => {
    if (slide.link) {
      if (isExternalLink(slide.link)) {
        window.open(slide.link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = slide.link;
      }
    }
  }, []);

  if (loading) {
    return (
      <section className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#219898]" />
      </section>
    );
  }

  if (sliderImages.length === 0) {
    return (
      <section className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No slider images available</p>
      </section>
    );
  }

  const currentSlide = sliderImages[currentImageIndex];
  
  return (
    <section className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden bg-gray-100">
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      
      <button
        onClick={goToNextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
        aria-label="Next slide"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
      
      {/* Slides */}
      <div className="h-full relative">
        {sliderImages.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => handleSlideClick(slide)}
            style={{ cursor: slide.link ? 'pointer' : 'default' }}
          >
            <img
              src={slide.image}
              alt={slide.alt || `Slide ${index + 1}`}
              className="object-cover w-full h-full"
              loading={index === 0 ? "eager" : "lazy"}
              width="1920"
              height="1080"
            />
            
            {slide.showOverlay && (
              <div className="absolute inset-0 bg-black/40"></div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              {slide.title && (
                <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${slide.showOverlay ? 'text-white' : 'text-gray-900'}`}>
                  {slide.title}
                </h2>
              )}
              
              {slide.subtitle && (
                <p className={`text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-6 ${slide.showOverlay ? 'text-white/90' : 'text-gray-700'}`}>
                  {slide.subtitle}
                </p>
              )}
              
              {slide.buttonText && slide.link && (
                <Link 
                  to={isExternalLink(slide.link) ? '#' : slide.link}
                  onClick={(e) => {
                    if (isExternalLink(slide.link)) {
                      e.preventDefault();
                      window.open(slide.link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#219898] hover:bg-[#197979]"
                >
                  {slide.buttonText}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex ? 'bg-white scale-125 shadow-lg' : 'bg-white/50'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(Hero);

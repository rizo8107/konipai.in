import { useState, useEffect } from 'react';
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

  const goToSlide = (index: number) => {
    console.log('Going to slide:', index);
    setCurrentImageIndex(index);
  };

  const goToPrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Going to previous slide');
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? sliderImages.length - 1 : prevIndex - 1
    );
  };

  const goToNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Going to next slide');
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

  if (loading) {
    return (
      <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#219898]" />
      </section>
    );
  }

  if (sliderImages.length === 0) {
    return (
      <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No slider images available</p>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Image Slider */}
      <div className="absolute inset-0 w-full h-full">
        {sliderImages.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
              currentImageIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            } cursor-pointer`}
            onClick={() => handleSlideClick(slide)}
          >
            <img 
              src={slide.image} 
              alt={slide.alt || `Slide ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <div className="absolute inset-0 flex items-center justify-between p-4 z-30 pointer-events-none">
        <button 
          onClick={goToPrevSlide}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-3 rounded-full text-white transition-all duration-300 pointer-events-auto"
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button 
          onClick={goToNextSlide}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-3 rounded-full text-white transition-all duration-300 pointer-events-auto"
          aria-label="Next slide"
        >
          <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
      
      {/* Slider Navigation Dots */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToSlide(index);
            }}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              currentImageIndex === index ? 'bg-white w-6 md:w-10' : 'bg-white/50'
            } hover:bg-white`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-20" />
    </section>
  );
};

export default Hero;

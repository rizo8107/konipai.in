import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProducts, pb, SliderImageRecord } from '@/lib/pocketbase';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types/product';
import { Loader2 } from 'lucide-react';
import Testimonials from '@/components/Testimonials';
import Sustainability from '@/components/Sustainability';
import { ProductImage } from '@/components/ProductImage';

type SliderImage = SliderImageRecord;

const Index = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [sliderLoading, setSliderLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setSliderLoading(true);

        // Fetch products and slider images in parallel
        const [bestsellersData, newArrivalsData, sliderData] = await Promise.all([
          getProducts({ bestseller: true }, controller.signal),
          getProducts({ new: true }, controller.signal),
          pb.collection('slider_images').getList<SliderImage>(1, 10, {
            filter: 'active = true',
            sort: 'order',
          }),
        ]);

        setBestsellers(bestsellersData);
        setNewArrivals(newArrivalsData);
        setSliderImages(sliderData.items);
      } catch (error) {
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Error fetching data:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load content. Please refresh the page.",
          });
        }
      } finally {
        setLoading(false);
        setSliderLoading(false);
      }
    };
    
    fetchData();

    return () => {
      controller.abort();
    };
  }, [toast]);

  useEffect(() => {
    if (sliderImages.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [sliderImages]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image Slider */}
      <section className="relative h-[35vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto h-full relative px-4">
          {sliderLoading ? (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : sliderImages.length === 0 ? (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">No images available</p>
            </div>
          ) : (
            <>
              {sliderImages.map((image, index) => (
                <Link 
                  key={image.id}
                  to={image.link}
                  className="block absolute inset-0"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: currentSlide === index ? 1 : 0,
                      zIndex: currentSlide === index ? 1 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className="relative h-full flex items-center justify-center"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={`${pb.baseUrl}/api/files/slider_images/${image.id}/${image.image}`}
                        alt={image.alt}
                        className="w-auto h-full max-w-full object-contain"
                        style={{ maxHeight: 'calc(100% - 2rem)' }}
                      />
                    </div>
                  </motion.div>
                </Link>
              ))}
              
              {/* Slider Controls */}
              <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    prevSlide();
                  }}
                  className="bg-white/80 hover:bg-white pointer-events-auto"
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    nextSlide();
                  }}
                  className="bg-white/80 hover:bg-white pointer-events-auto"
                  aria-label="Next slide"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Slider Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                {sliderImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentSlide(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all pointer-events-auto ${
                      currentSlide === index ? 'bg-black w-4' : 'bg-black/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Our Products */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Products</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {loading ? (
              // Loading state
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="relative aspect-square bg-gray-50 rounded-lg mb-2">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-pulse w-8 h-8 rounded-full bg-gray-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              [...newArrivals, ...bestsellers]
                .filter((product, index, self) => 
                  index === self.findIndex((p) => p.id === product.id)
                )
                .map((product) => (
                  <Link 
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg mb-2">
                      <ProductImage 
                        url={product.images?.[0] || ''}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                      />
                      
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.bestseller && (
                          <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                            Bestseller
                          </span>
                        )}
                        {product.new && (
                          <span className="bg-primary/90 text-white text-xs px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-0.5 truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                        </p>
                        {product.colors?.length > 0 && (
                          <div className="flex -space-x-1">
                            {product.colors.map((color) => (
                              <div 
                                key={color.value}
                                className="w-3 h-3 rounded-full border border-white ring-1 ring-gray-200"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Brand Features Section */}
      <section className="py-16 px-4 md:px-8 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-[#E8F5F5] text-[#219898] hover:bg-[#E8F5F5]"
            >
              Eco-friendly & Stylish
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              Sustainable Totes
              <br />
              <span className="text-[#219898]">for Modern Living</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Beautifully crafted canvas tote bags designed for everyday use. Made with 100% organic materials and sustainable practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-[#219898] text-white hover:bg-[#219898]/90"
              >
                <Link to="/shop">
                  Shop Collection
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#219898] text-[#219898] hover:bg-[#219898] hover:text-white"
              >
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-[#219898] mb-2">100%</p>
              <p className="text-gray-600">Organic Materials</p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-[#219898] mb-2">5,000+</p>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-[#219898] mb-2">4.9/5</p>
              <p className="text-gray-600">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      <Sustainability />
      <Testimonials />
    </div>
  );
};

export default Index;

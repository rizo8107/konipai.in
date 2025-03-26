import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Leaf, Heart, Package, ShoppingBag, PlusCircle } from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import { getProducts, type Product } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { ProductImage } from '@/components/ProductImage';
import { useInView } from 'react-intersection-observer';
import { Card } from '@/components/ui/card';
import { trackButtonClick } from '@/lib/analytics';

const FeatureItem = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center p-6 transition-all rounded-lg">
    <div className="bg-[#219898]/10 p-3 rounded-full mb-4">
      <Icon className="h-6 w-6 text-[#219898]" />
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
  </div>
);

const CategoryBadge = ({ title, onClick }: { title: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 rounded-full border border-gray-200 hover:border-[#219898] hover:bg-[#219898]/5 transition-colors text-sm font-medium"
  >
    {title}
  </button>
);

const Index = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // Use intersection observer for animations
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const [bestsellersRef, bestsellersInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const [newArrivalsRef, newArrivalsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [bestsellersData, newArrivalsData] = await Promise.all([
          getProducts({ bestseller: true }, controller.signal),
          getProducts({ new: true }, controller.signal)
        ]);
        
        // Get featured products from bestsellers if needed
        const featuredOnes = bestsellersData.slice(0, 1);
        
        setBestsellers(bestsellersData);
        setNewArrivals(newArrivalsData);
        setFeaturedProducts(featuredOnes);
      } catch (error) {
        // Only log error if it's not an abort error
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Error fetching products:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const handleCategoryClick = (category: string) => {
    trackButtonClick(`category_${category.toLowerCase().replace(/\s+/g, '_')}`, category, window.location.pathname);
    window.location.href = `/shop?category=${encodeURIComponent(category)}`;
  };

  const handleShopNowClick = () => {
    trackButtonClick('shop_now_button', 'Shop Now', window.location.pathname);
  };
  
  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <div ref={heroRef} className="relative">
        <Hero />
        <div className="absolute inset-0 z-10 flex items-end pointer-events-none">
          <div className="konipai-container py-12 mb-6 animate-fade-in relative z-20">
            <div className="max-w-xl bg-black/15 backdrop-blur-sm p-6 rounded-lg">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg text-shadow-dark">
                Minimal. <span className="text-[#219898]">Sustainable</span>. Beautiful.
              </h1>
              <p className="text-white text-xl mb-6 drop-shadow-lg text-shadow-dark">
                Stylish tote bags crafted for the conscious minimalist.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-black hover:bg-[#219898] hover:text-white transition-colors rounded-full px-8 py-6 text-lg pointer-events-auto"
                onClick={handleShopNowClick}
              >
                <Link to="/shop">Shop Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="konipai-container">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <CategoryBadge title="All Bags" onClick={() => handleCategoryClick('All')} />
            <CategoryBadge title="Tote Bags" onClick={() => handleCategoryClick('Tote Bags')} />
            <CategoryBadge title="Travel Bags" onClick={() => handleCategoryClick('Travel Bags')} />
            <CategoryBadge title="Shopping Bags" onClick={() => handleCategoryClick('Shopping Bags')} />
            <CategoryBadge title="Eco Friendly" onClick={() => handleCategoryClick('Eco Friendly')} />
          </div>
        </div>
      </section>

      {/* Featured Product */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="konipai-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl overflow-hidden h-[500px] relative group">
                {featuredProducts[0]?.images && featuredProducts[0].images[0] && (
                  <ProductImage 
                    url={featuredProducts[0].images[0]} 
                    alt={featuredProducts[0].name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={true}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white">
                    <p className="text-sm font-medium uppercase tracking-wider mb-2">Featured Collection</p>
                    <h3 className="text-2xl font-bold mb-2">{featuredProducts[0]?.name}</h3>
                    <Button asChild variant="outline" className="bg-white/20 border-white text-white backdrop-blur-sm hover:bg-white hover:text-black">
                      <Link to={`/product/${featuredProducts[0]?.id}`}>View Product</Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center max-w-lg">
                <Badge className="mb-4 py-1.5 px-3 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20 self-start">Featured Collection</Badge>
                <h2 className="text-4xl font-bold mb-6">Discover Our Premium Collection</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Our premium collection combines innovative design with sustainable materials, crafted for the conscious minimalist who values both style and environmental responsibility.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#219898] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Premium Quality</h4>
                      <p className="text-sm text-gray-600">Handcrafted with premium sustainable materials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf className="h-5 w-5 text-[#219898] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Eco-friendly</h4>
                      <p className="text-sm text-gray-600">Made from 100% organic cotton and recycled materials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-[#219898] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Durable Design</h4>
                      <p className="text-sm text-gray-600">Built to last with reinforced stitching and quality hardware</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Button 
                    asChild 
                    className="gap-2 bg-[#219898] hover:bg-[#1a7a7a] text-white rounded-full px-6"
                    onClick={() => trackButtonClick('explore_collection_button', 'Explore Collection', window.location.pathname)}
                  >
                    <Link to="/shop">
                      Explore Collection
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section 
        ref={newArrivalsRef} 
        className={`py-24 bg-white ${newArrivalsInView ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: '0.2s' }}
      >
        <div className="konipai-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-bold mb-4">New Arrivals</h2>
            <p className="text-gray-600">
              Discover our latest collection of stylish and sustainable tote bags, designed for the modern minimalist.
            </p>
          </div>
          <div className="relative">
            <ProductGrid products={newArrivals.slice(0, 4)} loading={loading} />
            <div className="mt-10 text-center">
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="rounded-full border-[#219898] text-[#219898] hover:bg-[#219898] hover:text-white px-8"
                onClick={() => trackButtonClick('view_new_arrivals_button', 'View All New Arrivals', window.location.pathname)}
              >
                <Link to="/new-arrivals">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className={`py-20 bg-[#219898]/5 ${featuresInView ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: '0.3s' }}
      >
        <div className="konipai-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 py-1.5 px-3 bg-white text-[#219898] hover:bg-white/80">What Makes Us Different</Badge>
            <h2 className="text-4xl font-bold mb-4">Crafted with Care</h2>
            <p className="text-gray-600">
              At Konipai, we believe in creating bags that are not only beautiful but also responsible. Every detail matters.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem 
              icon={Leaf}
              title="Sustainable Materials"
              description="Made from 100% organic cotton and eco-friendly materials, our bags are kind to the planet."
            />
            <FeatureItem 
              icon={ShieldCheck}
              title="Quality Craftsmanship"
              description="Each bag is meticulously handcrafted by skilled artisans, ensuring premium quality and attention to detail."
            />
            <FeatureItem 
              icon={Truck}
              title="Carbon-Neutral Shipping"
              description="We offset the carbon footprint of every delivery to minimize environmental impact."
            />
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section 
        ref={bestsellersRef}
        className={`py-24 bg-white ${bestsellersInView ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: '0.4s' }}
      >
        <div className="konipai-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 py-1.5 px-3 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">Customer Favorites</Badge>
            <h2 className="text-4xl font-bold mb-4">Our Bestsellers</h2>
            <p className="text-gray-600">
              Discover why these bags are loved by our community. Each bestseller is a testament to our commitment to quality and style.
            </p>
          </div>
          
          <div className="relative">
            <ProductGrid products={bestsellers.slice(0, 4)} loading={loading} />
            <div className="mt-10 text-center">
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="rounded-full border-[#219898] text-[#219898] hover:bg-[#219898] hover:text-white px-8"
                onClick={() => trackButtonClick('view_bestsellers_button', 'View All Bestsellers', window.location.pathname)}
              >
                <Link to="/bestsellers">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="py-20 bg-[#219898] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path fill="currentColor" d="M42.8,-71.9C55.9,-64.7,67.1,-53.6,74.2,-40.1C81.3,-26.6,84.5,-10.8,82.8,4.1C81.2,19,74.7,33,65.9,45.1C57,57.2,45.8,67.3,32.8,73.1C19.9,78.9,5.1,80.3,-9.3,78.5C-23.6,76.7,-37.4,71.6,-48.1,62.8C-58.8,54,-66.3,41.5,-70.4,28.1C-74.5,14.7,-75.1,0.4,-73.4,-13.8C-71.7,-27.9,-67.7,-42,-58.9,-52.4C-50.1,-62.8,-36.5,-69.5,-22.8,-75.1C-9.1,-80.7,4.6,-85.3,18.1,-83.2C31.6,-81.1,29.8,-79.2,42.8,-71.9Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="konipai-container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Join the Sustainable Fashion Movement</h2>
            <p className="text-white/80 text-lg mb-8">
              Experience the perfect blend of style, functionality, and sustainability with our premium tote bags.
            </p>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#219898] rounded-full px-8"
              onClick={() => trackButtonClick('shop_collection_button', 'Shop Collection', window.location.pathname)}
            >
              <Link to="/shop">Shop Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <div className="relative">
        <Testimonials />
      </div>

      {/* Newsletter Section */}
      <div className="relative bg-gray-50">
        <Newsletter />
      </div>
    </div>
  );
};

export default Index;

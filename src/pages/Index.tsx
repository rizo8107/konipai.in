import { useState, useEffect, useRef } from 'react';
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
import { Card } from '@/components/ui/card';
import { trackButtonClick } from '@/lib/analytics';
import UtmLink from '@/components/UtmLink';

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
  
  // Simple refs without animation dependency
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const bestsellersRef = useRef<HTMLElement>(null);
  const newArrivalsRef = useRef<HTMLElement>(null);
  
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
                      <UtmLink to={`/product/${featuredProducts[0]?.id}`}>View Product</UtmLink>
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
                    <UtmLink to="/shop">
                      Explore Collection
                      <ArrowRight className="h-4 w-4" />
                    </UtmLink>
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
        className="py-24 bg-white animate-fade-in"
        style={{ 
          animationDelay: '0.2s',
          minHeight: '600px',
          willChange: 'opacity'
        }}
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
                <UtmLink to="/new-arrivals">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </UtmLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-20 bg-[#219898]/5 animate-fade-in"
        style={{ 
          animationDelay: '0.3s',
          minHeight: '500px',
          willChange: 'opacity'
        }}
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
        className="py-24 bg-white animate-fade-in"
        style={{ 
          animationDelay: '0.4s',
          minHeight: '600px',
          willChange: 'opacity'
        }}
      >
        <div className="konipai-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-bold mb-4">Bestsellers</h2>
            <p className="text-gray-600">
              Our most popular bags selected by our customers.
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
                <UtmLink to="/bestsellers">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </UtmLink>
              </Button>
            </div>
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

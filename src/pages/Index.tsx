import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Truck, Leaf } from 'lucide-react';
import Hero from '@/components/Hero';
import FeaturedCategories from '@/components/FeaturedCategories';
import ProductGrid from '@/components/ProductGrid';
import Testimonials from '@/components/Testimonials';
import Sustainability from '@/components/Sustainability';
import Newsletter from '@/components/Newsletter';
import { getBestsellers, getNewArrivals } from '@/lib/product-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [bestsellersData, newArrivalsData] = await Promise.all([
          getBestsellers(),
          getNewArrivals()
        ]);
        setBestsellers(bestsellersData);
        setNewArrivals(newArrivalsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const features = [
    {
      title: "Handcrafted Excellence",
      description: "Each bag is meticulously crafted by skilled artisans using premium materials.",
      image: newArrivals[0]?.images[0] || "/product-images/create-a-mockup-of-white-tote-bag-a-girl-wearing-i.png"
    },
    {
      title: "Sustainable Design",
      description: "Made with 100% organic cotton and eco-friendly materials for a better planet.",
      image: newArrivals[1]?.images[0] || "/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png"
    },
    {
      title: "Modern Lifestyle",
      description: "Perfect blend of style and functionality for your everyday adventures.",
      image: newArrivals[2]?.images[0] || "/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png"
    }
  ];

  return (
    <div className="flex flex-col">
      <Hero />
      
      {/* Trust Badges */}
      <div className="bg-[#219898]/5 border-y border-[#219898]/10">
        <div className="konipai-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Star className="h-6 w-6 text-[#219898]" />
              <p className="text-sm font-medium">5-Star Rated Products</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#219898]" />
              <p className="text-sm font-medium">Secure Checkout</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-6 w-6 text-[#219898]" />
              <p className="text-sm font-medium">Free Shipping</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Leaf className="h-6 w-6 text-[#219898]" />
              <p className="text-sm font-medium">Eco-Friendly</p>
            </div>
          </div>
        </div>
      </div>

      <FeaturedCategories />
      
      {/* Featured Collection */}
      <section className="py-20 bg-white">
        <div className="konipai-container">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <Badge className="mb-4 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">New Collection</Badge>
              <h2 className="text-4xl font-bold mb-6">Discover Our Latest Collection</h2>
              <p className="text-lg text-gray-600 mb-8">
                Explore our newest range of sustainable tote bags, designed for the modern minimalist. 
                Each piece is thoughtfully crafted to complement your lifestyle while making a positive impact.
              </p>
              <Link to="/new-arrivals">
                <Button className="bg-[#219898] hover:bg-[#219898]/90">
                  View Collection <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1 relative">
              {loading ? (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#219898]" />
                </div>
              ) : (
                <>
                  <img 
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                    className="w-full rounded-lg shadow-lg transition-all duration-500"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">{features[activeFeature].title}</h3>
                    <p className="text-gray-600">{features[activeFeature].description}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeFeature ? 'bg-[#219898] w-8' : 'bg-[#219898]/20'
                }`}
                onClick={() => setActiveFeature(index)}
                aria-label={`View ${feature.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-20 bg-gray-50">
        <div className="konipai-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-4 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">Most Popular</Badge>
            <h2 className="text-4xl font-bold mb-6">Our Bestsellers</h2>
            <p className="text-lg text-gray-600">
              Discover why these bags are loved by our community. Each bestseller is a testament to our commitment to quality and style.
            </p>
          </div>
          <ProductGrid products={bestsellers} loading={loading} />
        </div>
      </section>

      <Sustainability />
      
      {/* Impact Section */}
      <section className="py-20 bg-white">
        <div className="konipai-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">Our Impact</Badge>
              <h2 className="text-4xl font-bold mb-6">Making a Difference</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#219898]/10 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-[#219898]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Sustainable Materials</h3>
                    <p className="text-gray-600">100% organic cotton and eco-friendly dyes used in all our products.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#219898]/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-[#219898]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Quality Craftsmanship</h3>
                    <p className="text-gray-600">Each bag is handcrafted by skilled artisans ensuring the highest quality.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#219898]/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-[#219898]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ethical Production</h3>
                    <p className="text-gray-600">Fair wages and safe working conditions for all our artisans.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={bestsellers[0]?.images[0] || "/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png"}
                alt="Sustainable Impact"
                className="w-full rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
                <p className="text-2xl font-bold text-[#219898] mb-1">10,000+</p>
                <p className="text-sm text-gray-600">Plastic bags saved from landfills</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <Newsletter />
    </div>
  );
};

export default Index;

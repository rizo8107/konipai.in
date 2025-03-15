import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Truck, Leaf } from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import { getProducts } from '@/lib/pocketbase';
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
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [bestsellersData, newArrivalsData] = await Promise.all([
          getProducts({ bestseller: true }, controller.signal),
          getProducts({ new: true }, controller.signal)
        ]);
        setBestsellers(bestsellersData);
        setNewArrivals(newArrivalsData);
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
      {/* Hero Section */}
      <div className="relative">
        <Hero />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Bestsellers Section */}
      <section className="py-24 bg-gray-50">
        <div className="konipai-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">Most Popular</Badge>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#219898] to-[#2cc9c9] bg-clip-text text-transparent">Our Bestsellers</h2>
            <p className="text-lg text-gray-600">
              Discover why these bags are loved by our community. Each bestseller is a testament to our commitment to quality and style.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#219898]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#219898]/10 rounded-full blur-3xl"></div>
            <ProductGrid products={bestsellers} loading={loading} />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent z-10"></div>
        <Testimonials />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Newsletter Section */}
      <div className="relative bg-gray-50">
        <Newsletter />
      </div>
    </div>
  );
};

export default Index;

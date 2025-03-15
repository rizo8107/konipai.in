import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Star, Shield, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pocketbase } from '@/lib/pocketbase';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  bestseller: boolean;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const records = await pocketbase.collection('products').getList(1, 6, {
          sort: '-created',
          filter: 'featured = true'
        });
        setFeaturedProducts(records.items as unknown as Product[]);

        const bestsellers = await pocketbase.collection('products').getList(1, 4, {
          sort: '-created',
          filter: 'bestseller = true'
        });
        setBestSellers(bestsellers.items as unknown as Product[]);
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products. Please refresh the page.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [toast]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <Badge 
                variant="secondary" 
                className="mb-6 bg-[#E8F5F5] text-[#219898] hover:bg-[#E8F5F5]"
              >
                Eco-friendly & Stylish
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900">
                Sustainable Totes
                <br />
                <span className="text-[#219898]">for Modern Living</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Beautifully crafted canvas tote bags designed for everyday use. Made with 100% organic materials and sustainable practices.
              </p>
              <div className="flex gap-4">
                <Button 
                  asChild
                  size="lg" 
                  className="bg-[#219898] text-white hover:bg-[#219898]/90"
                >
                  <Link to="/shop">
                    Shop Collection
                    <ArrowRight className="ml-2 h-5 w-5" />
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

              <div className="grid grid-cols-3 gap-8 mt-16">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#219898] mb-2">100%</p>
                  <p className="text-sm text-gray-600">Organic Materials</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#219898] mb-2">5,000+</p>
                  <p className="text-sm text-gray-600">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#219898] mb-2">4.9/5</p>
                  <p className="text-sm text-gray-600">Customer Rating</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <img
                src="/hero-tote.jpg"
                alt="Featured Tote Bag"
                className="w-full rounded-2xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-[#219898]/10 flex items-center justify-center mr-4">
                <Star className="h-6 w-6 text-[#219898]" />
              </div>
              <p className="font-medium">5-Star Rated Products</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-[#219898]/10 flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-[#219898]" />
              </div>
              <p className="font-medium">Secure Checkout</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-[#219898]/10 flex items-center justify-center mr-4">
                <ShoppingBag className="h-6 w-6 text-[#219898]" />
              </div>
              <p className="font-medium">Free Shipping</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-[#219898]/10 flex items-center justify-center mr-4">
                <Leaf className="h-6 w-6 text-[#219898]" />
              </div>
              <p className="font-medium">Eco-Friendly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Collection</h2>
                <p className="text-gray-600">
                  Explore our latest designs that blend contemporary aesthetics with timeless functionality.
                </p>
              </motion.div>
            </div>
            <Button 
              asChild 
              variant="outline"
              size="lg"
              className="mt-6 lg:mt-0 border-[#219898] text-[#219898] hover:bg-[#219898] hover:text-white"
            >
              <Link to="/shop">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link 
                  to={`/product/${product.id}`}
                  className="group block"
                >
                  <Card className="overflow-hidden border-none rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="mt-2 text-xl font-semibold text-[#219898]">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#219898]">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10" />
        </div>
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Join Our Community</h2>
            <p className="text-white/90 text-lg mb-8">
              Subscribe to receive exclusive offers, first looks at new collections, and design inspiration.
            </p>
            <form className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-xl px-6 py-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <Button 
                type="submit"
                size="lg"
                variant="secondary"
                className="bg-white text-[#219898] hover:bg-white/90 rounded-xl"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
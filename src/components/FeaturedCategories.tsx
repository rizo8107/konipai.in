import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getProducts } from '@/lib/pocketbase';
import { Product } from '@/types/product';

const categories = [
  {
    name: 'Classic Totes',
    description: 'Timeless designs for everyday elegance',
    category: 'totes',
    link: '/shop?category=totes',
    defaultImage: '/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png'
  },
  {
    name: 'Crossbody Bags',
    description: 'Perfect blend of style and convenience',
    category: 'crossbody',
    link: '/shop?category=crossbody',
    defaultImage: '/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png'
  },
  {
    name: 'Backpack Totes',
    description: 'Versatile companions for urban adventures',
    category: 'backpack',
    link: '/shop?category=backpack',
    defaultImage: '/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png'
  }
];

const FeaturedCategories = () => {
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const productsPromises = categories.map(cat => 
          getProducts({ category: cat.category }, controller.signal)
        );
        const productsResults = await Promise.all(productsPromises);
        
        const categoryProductsMap: Record<string, Product[]> = {};
        categories.forEach((cat, index) => {
          categoryProductsMap[cat.category] = productsResults[index];
        });
        
        setCategoryProducts(categoryProductsMap);
      } catch (error) {
        // Only log error if it's not an abort error
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          console.error('Error fetching category products:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="konipai-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="mb-4 bg-[#219898]/10 text-[#219898] hover:bg-[#219898]/20">Categories</Badge>
          <h2 className="text-4xl font-bold mb-6">Shop by Category</h2>
          <p className="text-lg text-gray-600">
            Explore our collection of sustainable bags, each designed to complement your lifestyle while making a positive impact.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.name} 
              to={category.link} 
              className="group relative overflow-hidden rounded-xl bg-[#219898]/5 hover:bg-[#219898]/10 transition-all duration-300"
            >
              {loading ? (
                <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#219898]" />
                </div>
              ) : (
                <>
                  <div className="aspect-[4/5] overflow-hidden">
                    <img 
                      src={categoryProducts[category.category]?.[0]?.images[0] || category.defaultImage}
                      alt={category.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-semibold mb-2">{category.name}</h3>
                    <p className="text-white/80 mb-4">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        {categoryProducts[category.category]?.length || 0} Products
                      </span>
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;

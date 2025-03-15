import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/pocketbase';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/product';

const Bestsellers = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        const products = await getProducts();
        const bestsellers = products
          .filter(product => product.bestseller)
          .slice(0, 8);
        setBestsellers(bestsellers);
        setError(null);
      } catch (err) {
        setError('Failed to load bestsellers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBestsellers();
  }, []);
  
  if (error) {
    return (
      <div className="konipai-container py-8 text-center">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 konipai-btn-outline"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="konipai-container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Bestsellers</h1>
      <p className="text-center max-w-2xl mx-auto mb-10">
        Discover our most popular tote bags that our customers love. 
        Each design is crafted with care and made to last.
      </p>
      
      <ProductGrid products={bestsellers} loading={loading} />
    </div>
  );
};

export default Bestsellers;

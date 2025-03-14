
import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/product-service';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/product';

const NewArrivals = () => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const products = await getProducts();
        const newArrivals = products
          .filter(product => product.new)
          .slice(0, 8);
        setNewArrivals(newArrivals);
        setError(null);
      } catch (err) {
        setError('Failed to load new arrivals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewArrivals();
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
      <h1 className="text-3xl font-bold mb-8 text-center">New Arrivals</h1>
      <p className="text-center max-w-2xl mx-auto mb-10">
        Explore our latest tote bag designs, hot off the production line. 
        Be the first to carry these fresh styles.
      </p>
      
      <ProductGrid products={newArrivals} loading={loading} />
    </div>
  );
};

export default NewArrivals;

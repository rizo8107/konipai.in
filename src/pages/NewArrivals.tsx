import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/pocketbase';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/product';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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
    <div className="konipai-container py-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'New Arrivals' }
        ]}
        className="mb-6"
      />

      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">New Arrivals</h1>
          <p className="text-gray-600">Discover our latest products, fresh from our workshop.</p>
        </div>

        {loading ? (
          <ProductGrid loading={true} products={[]} />
        ) : (
          <ProductGrid products={newArrivals} loading={false} />
        )}
      </div>
    </div>
  );
};

export default NewArrivals;

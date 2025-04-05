import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/pocketbase';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/product';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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
    <div className="konipai-container py-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'Bestsellers' }
        ]}
        className="mb-6"
      />

      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Bestsellers</h1>
          <p className="text-gray-600">Our most popular products, loved by customers.</p>
        </div>

        {loading ? (
          <ProductGrid loading={true} products={[]} />
        ) : (
          <ProductGrid products={bestsellers} loading={false} />
        )}
      </div>
    </div>
  );
};

export default Bestsellers;

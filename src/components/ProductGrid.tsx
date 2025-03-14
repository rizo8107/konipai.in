import { useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ProductGridProps = {
  products: Product[];
  title?: string;
  loading?: boolean;
};

const ProductGrid = ({ products, title, loading = false }: ProductGridProps) => {
  const [displayCount, setDisplayCount] = useState(8);
  
  const showMore = () => {
    setDisplayCount(prevCount => prevCount + 8);
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div>
      {title && (
        <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.slice(0, displayCount).map(product => (
          <ProductCard key={product.$id} product={product} />
        ))}
      </div>
      
      {displayCount < products.length && (
        <div className="text-center mt-12">
          <Button 
            onClick={showMore}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;

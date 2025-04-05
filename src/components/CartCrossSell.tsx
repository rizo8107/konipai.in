import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { getProducts } from '@/lib/pocketbase';
import { Product } from '@/lib/pocketbase';
import { ProductImage } from '@/components/ProductImage';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CartCrossSellProps {
  onClose: () => void;
}

export function CartCrossSell({ onClose }: CartCrossSellProps) {
  const { items, addItem } = useCart();
  const [crossSellProducts, setCrossSellProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrossSellProducts = async () => {
      if (!items.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get unique categories from cart items
        const cartCategories = Array.from(
          new Set(items.map(item => item.product.category))
        );
        
        // Store product IDs in cart to avoid recommending them again
        const cartProductIds = items.map(item => item.productId);
        
        // Fetch products from the same categories
        const allCategoryProducts = await Promise.all(
          cartCategories.map(category => 
            getProducts({ category: category || '' })
          )
        );
        
        // Flatten and filter out products already in cart
        const recommendedProducts = allCategoryProducts
          .flat()
          .filter(product => !cartProductIds.includes(product.id))
          // Sort by bestseller for better recommendations
          .sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0))
          // Limit to 4 products
          .slice(0, 4);
        
        setCrossSellProducts(recommendedProducts);
      } catch (error) {
        console.error('Error fetching cross-sell products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrossSellProducts();
  }, [items]);

  // Skip rendering if no recommendations
  if (!loading && crossSellProducts.length === 0) {
    return null;
  }

  // Handle adding a product to cart
  const handleAddToCart = (product: Product) => {
    // Default to first color or empty string if no colors available
    const defaultColor = product.colors && product.colors.length > 0 
      ? product.colors[0].value 
      : '';
    
    addItem(product, 1, defaultColor);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="font-medium mb-3">Frequently Bought Together</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crossSellProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex gap-3 border rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
            >
              <div className="relative w-24 h-24 overflow-hidden bg-gray-100 rounded-md group flex-shrink-0">
                {product.images && product.images[0] ? (
                  <ProductImage
                    url={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <Link
                  to={`/product/${product.id}`}
                  className="text-sm font-medium hover:text-primary line-clamp-2 hover:underline"
                  onClick={onClose}
                >
                  {product.name}
                </Link>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-sm font-medium">₹{product.price.toFixed(2)}</span>
                    {product.original_price && product.original_price > product.price && (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.original_price.toFixed(2)}
                        </span>
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          {Math.round((1 - product.price / product.original_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs w-full whitespace-nowrap"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
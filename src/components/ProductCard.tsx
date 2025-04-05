import { Link } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { Product } from '@/lib/pocketbase';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProductImage } from '@/components/ProductImage';

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.colors || !Array.isArray(product.colors) || product.colors.length === 0) {
      addItem(product, 1, '');
      return;
    }
    
    addItem(product, 1, product.colors[0].value);
  };
  
  return (
    <Link 
      to={`/product/${product.id}`} 
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg mb-4">
        <ProductImage 
          url={product.images?.[0] || ''}
          alt={product.name}
          className="w-full h-full"
          aspectRatio="portrait"
          priority={false}
          size="small"
        />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          {product.bestseller && (
            <Badge variant="secondary" className="bg-black text-white rounded-full">
              Bestseller
            </Badge>
          )}
          {product.new && (
            <Badge variant="secondary" className="bg-primary/90 text-white rounded-full">
              New
            </Badge>
          )}
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Button
              onClick={handleQuickAdd}
              variant="default"
              size="sm"
              className="w-full bg-white text-black hover:bg-gray-100 shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-base font-medium",
                product.original_price && product.original_price > product.price ? "text-red-600" : ""
              )}>
                ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
              </p>
              {product.original_price && product.original_price > product.price && (
                <p className="text-sm text-gray-500 line-through">
                  ₹{product.original_price.toFixed(2)}
                </p>
              )}
            </div>
            {product.original_price && product.original_price > product.price && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  Save ₹{(product.original_price - product.price).toFixed(2)}
                </span>
                <span className="text-xs font-medium text-red-600">
                  ({Math.round((1 - product.price / product.original_price) * 100)}% OFF)
                </span>
              </div>
            )}
          </div>
          {product.colors?.length > 0 && (
            <div className="flex -space-x-1">
              {product.colors.map((color) => (
                <div 
                  key={color.value}
                  className="w-4 h-4 rounded-full border-2 border-white ring-1 ring-gray-200"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

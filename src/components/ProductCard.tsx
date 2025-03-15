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
      <div className="relative aspect-square overflow-hidden bg-gray-300 rounded-lg mb-4">
        <ProductImage 
          url={product.images?.[0] || ''}
          alt={product.name}
          className="w-full h-full object-cover object-center opacity-80"
        />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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

        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={handleQuickAdd}
            variant="default"
            size="lg"
            className="bg-white text-black hover:bg-gray-100 shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-base font-medium">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
          </p>
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

import { Link } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.colors.length > 0) {
      addToCart({
        id: product.$id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color: product.colors[0].value
      });
    }
  };
  
  return (
    <Link 
      to={`/product/${product.$id}`} 
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg mb-4">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover object-center transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.bestseller && (
            <Badge variant="default" className="bg-black text-white">
              Bestseller
            </Badge>
          )}
          {product.new && (
            <Badge variant="default" className="bg-primary text-white">
              New
            </Badge>
          )}
        </div>
        
        <Button
          onClick={handleQuickAdd}
          variant="default"
          size="sm"
          className={cn(
            "absolute bottom-3 left-3 right-3 opacity-0 translate-y-2",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "transition-all duration-200 bg-white text-black hover:bg-gray-100"
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Quick Add
        </Button>
      </div>
      
      <div>
        <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-base font-medium">${product.price.toFixed(2)}</p>
          {product.colors.length > 0 && (
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

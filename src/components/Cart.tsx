import { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, X, Minus, Plus, Loader2, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductImage } from '@/components/ProductImage';
import { cn } from '@/lib/utils';

interface CartProps {
  children?: ReactNode;
}

export function Cart({ children }: CartProps) {
  const { items, removeItem, updateQuantity, isLoading, subtotal, total, itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleCheckout = () => {
    // Save cart state before navigating
    localStorage.setItem('checkout_cart', JSON.stringify({
      items,
      subtotal,
      total,
      itemCount
    }));
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
          <SheetDescription>
            View and manage items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium mb-2">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add items to your cart to see them here
              </p>
            </div>
            <Button asChild variant="default" onClick={() => setIsOpen(false)}>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.productId}-${item.color}-${index}`} className="flex gap-4">
                    <div className="relative aspect-square h-24">
                      {item.product && item.product.images && item.product.images[0] ? (
                        <ProductImage
                          url={item.product.images[0]}
                          alt={item.product.name}
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <Link
                          to={`/product/${item.productId}`}
                          className="font-medium hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.product?.name || 'Product'}
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.color ? `Color: ${item.color}` : 'Default'}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="ml-auto font-medium">
                          ₹{((Number(item.product?.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-6">
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-medium">₹{(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Shipping</span>
                  <span className="font-medium">
                    {(subtotal || 0) >= 100 ? 'Free' : '₹10.00'}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>₹{(total || 0).toFixed(2)}</span>
                </div>
              </div>
              <Button 
                asChild 
                className="w-full" 
                onClick={handleCheckout}
                disabled={items.length === 0}
              >
                <Link to="/checkout">
                  Proceed to Checkout (₹{(total || 0).toFixed(2)})
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
} 
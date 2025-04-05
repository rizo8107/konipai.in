import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  couponCode?: string;
  finalTotal: number;
}

export function CheckoutSummary({
  items,
  subtotal,
  shippingCost,
  discountAmount = 0,
  couponCode,
  finalTotal
}: CheckoutSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-semibold">Order Summary</h2>
      </div>
      
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={`${item.productId}-${item.color}`} className="flex justify-between py-1">
            <div className="flex items-center gap-2">
              {item.product.images && item.product.images[0] && (
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-gray-700">
                {item.product.name}
                {item.color && <span className="text-gray-500 text-sm ml-1">({item.color})</span>}
                <span className="text-gray-500 text-sm ml-1">× {item.quantity}</span>
              </span>
            </div>
            <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <Separator />
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">
            {shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}
          </span>
        </div>
        
        {discountAmount > 0 && couponCode && (
          <div className="flex justify-between py-1">
            <span className="text-green-600">Discount ({couponCode})</span>
            <span className="font-medium text-green-600">-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Total</span>
          <span>₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

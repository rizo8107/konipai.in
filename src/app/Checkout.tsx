import { useCart } from '@/contexts/CartContext';

export default function Checkout() {
  const { items: cartItems, total } = useCart();

  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div key={item.product.id} className="flex justify-between py-1">
          <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
          <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between py-1">
          <span className="font-medium">Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
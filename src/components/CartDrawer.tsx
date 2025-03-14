import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const CartDrawer = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    cartTotal, 
    isCartOpen, 
    setIsCartOpen 
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsCartOpen(false)} 
        />
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5" />
                  <h2 className="text-lg font-medium">Shopping Cart</h2>
                  {cartItems.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  onClick={() => setIsCartOpen(false)}
                >
                  <span className="sr-only">Close panel</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6">
                  {cartItems.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {cartItems.map((item) => (
                        <li key={`${item.id}-${item.color}`} className="py-6 flex gap-4">
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>

                          <div className="flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between">
                                <h3 className="text-sm font-medium">
                                  <Link 
                                    to={`/product/${item.id}`}
                                    className="hover:text-konipai-mint transition-colors"
                                  >
                                    {item.name}
                                  </Link>
                                </h3>
                                <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 capitalize">{item.color}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center border rounded-lg bg-gray-50">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 hover:text-konipai-mint transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-4 py-1 text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 hover:text-konipai-mint transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-16">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">Your cart is empty</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start adding some items to your cart!
                      </p>
                      <div className="mt-6">
                        <Button
                          onClick={() => setIsCartOpen(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-lg font-medium">${cartTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-6">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <div className="space-y-3">
                    <Button
                      asChild
                      className="w-full bg-[#219898] hover:bg-[#219898]/90 text-white"
                    >
                      <Link
                        to="/checkout"
                        onClick={() => setIsCartOpen(false)}
                      >
                        Proceed to Checkout
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#219898] text-[#219898] hover:bg-[#219898]/5"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;

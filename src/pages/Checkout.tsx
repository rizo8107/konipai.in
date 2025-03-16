import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbase } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, subtotal, total, clearCart, isLoading: cartLoading } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/auth/login', { state: { from: '/checkout' } });
      return;
    }

    // Redirect if cart is empty (after loading)
    if (!cartLoading && (!items || items.length === 0)) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
      });
      navigate('/shop');
      return;
    }

    const loadUserAddress = async () => {
      if (!user?.id) return;

      try {
        const address = await pocketbase.collection('addresses')
          .getFirstListItem(`user="${user.id}"`);
        
        if (address) {
          setFormData(prev => ({
            ...prev,
            address: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.postalCode || '',
            phone: address.phone || '',
          }));
        }
      } catch (error) {
        // Only log error if it's not a 404 (no address found)
        if (error.status !== 404) {
          console.warn('Failed to load saved address:', error);
        }
      }
    };

    loadUserAddress();
  }, [user, navigate, items, cartLoading, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }

    try {
      setIsSubmitting(true);

      if (!user?.id) {
        throw new Error('Please login to complete your order');
      }

      if (!items || items.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Validate cart items
      const invalidItems = items.filter(item => 
        !item.product || 
        !item.productId || 
        typeof item.quantity !== 'number' || 
        item.quantity < 1 ||
        typeof item.product.price !== 'number' ||
        isNaN(item.product.price)
      );

      if (invalidItems.length > 0) {
        throw new Error('Some items in your cart are invalid. Please try refreshing the page.');
      }

      // Create or update address
      let addressId;
      try {
        const addressData = {
          user: user.id,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: 'United States',
          isDefault: true,
        };

        const existingAddress = await pocketbase.collection('addresses')
          .getFirstListItem(`user="${user.id}"`);
        
        if (existingAddress) {
          const updated = await pocketbase.collection('addresses').update(existingAddress.id, addressData);
          addressId = updated.id;
        } else {
          const created = await pocketbase.collection('addresses').create(addressData);
          addressId = created.id;
        }
      } catch (error) {
        if (error.status === 404) {
          const created = await pocketbase.collection('addresses').create({
            user: user.id,
            street: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: 'United States',
            isDefault: true,
          });
          addressId = created.id;
        } else {
          throw new Error('Failed to save shipping address. Please try again.');
        }
      }

      // Create order
      const shipping_cost = subtotal >= 100 ? 0 : 10;
      const orderData = {
        user: user.id,
        products: JSON.stringify(items.map(item => ({
          productId: item.productId,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images,
          },
          quantity: item.quantity,
          color: item.color,
        }))),
        subtotal,
        total,
        shipping_cost,
        status: 'pending',
        shipping_address: addressId,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_status: 'pending',
      };

      const order = await pocketbase.collection('orders').create(orderData);

      // Clear cart data - do this after order is successfully created
      try {
        // First try to delete the server cart
        if (user.id) {
          try {
            const serverCart = await pocketbase.collection('carts').getFirstListItem(`user="${user.id}"`);
            if (serverCart?.id) {
              await pocketbase.collection('carts').delete(serverCart.id);
            }
          } catch (error) {
            if (error.status !== 404) {
              console.warn('Failed to delete server cart:', error);
            }
          }
        }

        // Then clear local cart state and storage
        clearCart();
        localStorage.removeItem('checkout_cart');
      } catch (error) {
        console.warn('Failed to clear cart:', error);
        // Don't throw error here, as the order was successfully created
      }

      // Show success message
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      });
      
      // Redirect to order confirmation page
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to process your order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Loading cart details...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Add some items to your cart to proceed with checkout.</p>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Shipping Address</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={`${item.productId}-${item.color}`} className="flex justify-between py-1">
                <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">{subtotal >= 100 ? 'Free' : `₹${10.00.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between py-1 font-semibold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {isSubmitting ? (
          <Button disabled className="w-full mt-3">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        ) : (
          <Button type="submit" className="w-full mt-3">
            {`Place Order - ₹${total.toFixed(2)}`}
          </Button>
        )}
      </form>
    </div>
  );
}

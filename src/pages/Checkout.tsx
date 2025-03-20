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
import { 
  loadRazorpayScript, 
  getRazorpayKeyId, 
  createRazorpayOrder, 
  openRazorpayCheckout,
  verifyRazorpayPayment,
  RazorpayResponse
} from '@/lib/razorpay';

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
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: user?.phone || '',
  });

  // Load Razorpay script
  useEffect(() => {
    const loadScript = async () => {
      const isLoaded = await loadRazorpayScript();
      setRazorpayLoaded(isLoaded);
      if (!isLoaded) {
        console.error('Failed to load Razorpay script');
      }
    };
    
    loadScript();
  }, []);

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
        // Update form with user data including phone number
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        }));
        
        const address = await pocketbase.collection('addresses')
          .getFirstListItem(`user="${user.id}"`);
        
        if (address) {
          setFormData(prev => ({
            ...prev,
            address: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.postalCode || '',
            // Only override phone from address if user doesn't have a phone number
            phone: prev.phone || address.phone || ''
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

  const handlePaymentSuccess = async (response: RazorpayResponse, orderId: string) => {
    try {
      setIsPaymentProcessing(true);
      
      console.log('Payment success:', response);
      
      // For direct payment flow (test mode), razorpay_order_id may not be present
      // In this case, we use the orderId from our database
      const paymentId = response.razorpay_payment_id;
      const orderIdToUse = response.razorpay_order_id || orderId;
      const signature = response.razorpay_signature || 'test_signature';
      
      // Verify payment
      const verified = await verifyRazorpayPayment(
        paymentId,
        orderIdToUse,
        signature
      );

      if (!verified) {
        throw new Error('Payment verification failed. Please contact support.');
      }

      // Update order with payment information
      try {
        await pocketbase.collection('orders').update(orderId, {
          payment_status: 'paid',
          razorpay_order_id: orderIdToUse,  // Using the exact field name from PocketBase schema
          razorpay_payment_id: paymentId,   // Using the exact field name from PocketBase schema
          notes: `Payment completed via Razorpay. Payment ID: ${paymentId}` // Adding notes about the payment
        });
        console.log('Order updated with payment information:', {
          orderId,
          razorpay_order_id: orderIdToUse,
          razorpay_payment_id: paymentId,
          notes: `Payment completed via Razorpay. Payment ID: ${paymentId}`
        });
      } catch (updateError) {
        console.error('Failed to update order with payment details:', updateError);
        // Continue with checkout process even if update fails
      }

      // Clear cart data - do this after payment is successfully processed
      try {
        // First try to delete the server cart
        if (user?.id) {
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
      }

      // Show success message
      toast({
        title: "Payment successful!",
        description: "Thank you for your purchase.",
      });

      // Redirect to order confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process your payment. Please try again or contact support.",
      });
    } finally {
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isPaymentProcessing) {
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

      // Check if Razorpay is loaded
      if (!razorpayLoaded) {
        throw new Error('Payment gateway is not available. Please refresh the page and try again.');
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
          country: 'India',
          isDefault: true,
          phone: formData.phone,
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
            country: 'India',
            isDefault: true,
            phone: formData.phone,
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
        shippingAddress: addressId, // Changed from shipping_address to match PocketBase field name
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_status: 'pending',
      };

      const order = await pocketbase.collection('orders').create(orderData);

      // Create Razorpay order
      const razorpayOrderResponse = await createRazorpayOrder(
        total, // amount in INR
        'INR',  // currency
        order.id // receipt (using our order ID)
      );

      if (!razorpayOrderResponse || !razorpayOrderResponse.id) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Open Razorpay payment form
      openRazorpayCheckout({
        key: getRazorpayKeyId(),
        amount: total * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Konipai',
        description: `Order #${order.id}`,
        image: import.meta.env.VITE_SITE_LOGO || 'https://konipai.in/assets/logo.png',
        order_id: razorpayOrderResponse.id,
        handler: (response) => handlePaymentSuccess(response, order.id),
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          order_id: order.id,
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
        },
        theme: {
          color: '#4F46E5', // Indigo color that matches Konipai theme
        }
      });

      // NOTE: After this point, the payment flow is handled by Razorpay's modal
      // The handlePaymentSuccess function will be called when payment is completed
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to process your order. Please try again.",
      });
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

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payment Method</h2>
          <div className="flex items-center space-x-3 p-4 border rounded-md bg-gray-50">
            <img src="/razorpay-logo.svg" alt="Razorpay" className="h-8" onError={(e) => (e.currentTarget.src = 'https://razorpay.com/assets/razorpay-logo.svg')} />
            <div>
              <p className="font-medium">Pay with Razorpay</p>
              <p className="text-sm text-gray-500">Secure payment via Razorpay</p>
            </div>
          </div>
        </div>

        {isSubmitting || isPaymentProcessing ? (
          <Button disabled className="w-full mt-3">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isPaymentProcessing ? 'Processing Payment...' : 'Processing...'}
          </Button>
        ) : (
          <Button type="submit" className="w-full mt-3">
            {`Pay Now - ₹${total.toFixed(2)}`}
          </Button>
        )}
      </form>
    </div>
  );
}

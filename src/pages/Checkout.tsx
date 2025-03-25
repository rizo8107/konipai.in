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
import { Loader2, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  loadRazorpayScript, 
  getRazorpayKeyId, 
  createRazorpayOrder, 
  openRazorpayCheckout,
  verifyPayment,
  RazorpayResponse
} from '@/lib/razorpay';
import { trackEcommerceEvent } from '@/utils/analytics';

interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface CouponData {
  couponId: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  amount: number;
  discountAmount: number;
}

interface OrderData {
  id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  products: Array<{
    productId: string;
    product: {
      name: string;
      price: number;
      images?: string[];
    };
    quantity: number;
    color?: string;
  }>;
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  // New function to validate coupons directly in frontend
  const validateCouponInFrontend = async (code: string, currentSubtotal: number) => {
    try {
      // Search for the coupon directly
      const coupons = await pocketbase.collection('coupons').getList(1, 1, {
        filter: `code="${code}" && active=true`
      });

      if (coupons.items.length === 0) {
        return { valid: false, message: 'Invalid coupon code' };
      }

      const coupon = coupons.items[0];

      // Check expiration
      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
        return { valid: false, message: 'Coupon has expired' };
      }

      // Check usage limits
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, message: 'Coupon usage limit exceeded' };
      }

      // Check minimum purchase
      if (coupon.min_purchase && currentSubtotal < coupon.min_purchase) {
        return {
          valid: false,
          message: `Minimum purchase of ₹${coupon.min_purchase} required for this coupon`
        };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (currentSubtotal * coupon.amount) / 100;
      } else {
        // Apply full fixed amount regardless of subtotal
        discountAmount = coupon.amount;
      }

      return {
        valid: true,
        message: 'Coupon applied successfully',
        coupon,
        discountAmount
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, message: 'Failed to validate coupon' };
    }
  };

  // New function to apply coupon code
  const applyCoupon = async () => {
    // Reset previous coupon states
    setCouponError(null);
    setAppliedCoupon(null);
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    
    try {
      try {
        // First try the API endpoint if available
        const baseUrl = pocketbase.baseUrl.endsWith('/') 
          ? pocketbase.baseUrl.slice(0, -1) 
          : pocketbase.baseUrl;
        
        const response = await fetch(`${baseUrl}/api/coupons/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: couponCode.trim(),
            subtotal: subtotal
          }),
        });
        
        if (response.status === 404) {
          // API endpoint not found - fallback to frontend validation
          console.warn('Coupon API endpoint not available, using frontend validation');
          const result = await validateCouponInFrontend(couponCode.trim(), subtotal);
          
          if (result.valid) {
            setAppliedCoupon({
              couponId: result.coupon.id,
              code: result.coupon.code,
              type: result.coupon.type,
              amount: result.coupon.amount,
              discountAmount: result.discountAmount
            });
            setCouponError(null);
            toast({
              title: "Coupon Applied",
              description: result.message,
            });
          } else {
            setCouponError(result.message);
            setAppliedCoupon(null);
          }
          return;
        }
        
        const apiResult = await response.json();
        
        if (response.ok && apiResult.success) {
          setAppliedCoupon(apiResult.data);
          setCouponError(null);
          toast({
            title: "Coupon Applied",
            description: apiResult.message,
          });
        } else {
          setCouponError(apiResult.message || 'Invalid coupon code');
          setAppliedCoupon(null);
        }
      } catch (fetchError) {
        console.error('Error accessing coupon API:', fetchError);
        // Fallback to frontend validation
        const result = await validateCouponInFrontend(couponCode.trim(), subtotal);
        
        if (result.valid) {
          setAppliedCoupon({
            couponId: result.coupon.id,
            code: result.coupon.code,
            type: result.coupon.type,
            amount: result.coupon.amount,
            discountAmount: result.discountAmount
          });
          setCouponError(null);
          toast({
            title: "Coupon Applied",
            description: result.message,
          });
        } else {
          setCouponError(result.message);
          setAppliedCoupon(null);
        }
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Function to remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handlePaymentSuccess = async (response: RazorpayResponse, orderId: string) => {
    try {
      setIsPaymentProcessing(true);
      toast({
        title: "Processing payment...",
        description: "Please wait while we verify your payment.",
      });

      console.log('Payment success, raw response:', response);
      
      // The response might be coming directly from Razorpay as an object with different structure
      // Extract payment details from response, handling both possible formats
      const paymentId = response.razorpay_payment_id || response.paymentId;
      
      if (!paymentId) {
        console.error('Missing payment ID in response:', response);
        throw new Error('Missing payment ID from Razorpay');
      }

      // First try to update the order record
      try {
        // Prepare minimal data for update to avoid conflicts
        const orderUpdateData: {
          payment_status: string;
          status: string;
          payment_id: string;
          payment_signature?: string;
          payment_order_id?: string;
        } = {
          payment_status: 'paid',
          status: 'processing',
          payment_id: paymentId
        };

        // Only add optional fields if they exist
        if (response.razorpay_signature || response.signature) {
          orderUpdateData.payment_signature = response.razorpay_signature || response.signature;
        }
        
        if (response.razorpay_order_id || response.orderId) {
          orderUpdateData.payment_order_id = response.razorpay_order_id || response.orderId;
        }

        console.log('Updating order with data:', orderUpdateData);
        
        // Update order status directly without verification
        await pocketbase.collection('orders').update(orderId, orderUpdateData);

        // Payment verified successfully
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully!",
        });

        // Track purchase event
        trackEcommerceEvent('purchase', 
          items.map(item => ({
            item_id: item.productId,
            item_name: item.product.name,
            price: Number(item.product.price) || 0,
            quantity: item.quantity,
            item_variant: item.color || undefined
          })),
          'INR',
          calculateFinalTotal().finalTotal
        );

        // Clear cart
        clearCart();
        
        // Redirect to order confirmation page
        navigate(`/order-confirmation/${orderId}`);
      } catch (updateError) {
        console.error('Failed to update order status:', updateError);
        
        // Show a user-friendly error but still consider payment successful
        toast({
          variant: "destructive",
          title: "Order Update Failed",
          description: "Payment was successful, but we couldn't update your order. Please contact support.",
        });
        
        // Still redirect to confirmation with payment pending status
        navigate(`/order-confirmation/${orderId}?status=payment_pending`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      
      // Show a user-friendly error
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "There was an issue processing your payment. Your order has been recorded but payment verification failed.",
      });
      
      // Still redirect to order confirmation, they may need to try payment again
      navigate(`/order-confirmation/${orderId}?status=payment_pending`);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const calculateFinalTotal = () => {
    const shipping_cost = subtotal >= 100 ? 0 : 10;
    let finalTotal = subtotal + shipping_cost;
    
    // Apply coupon discount if available
    if (appliedCoupon) {
      finalTotal -= appliedCoupon.discountAmount;
      // Allow negative totals (minimum 0)
      finalTotal = Math.max(finalTotal, 0);
    }
    
    return {
      finalTotal,
      shipping_cost
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isPaymentProcessing) {
      return; // Prevent double submission
    }

    // Track beginning of checkout process with Google Analytics
    trackEcommerceEvent('begin_checkout', 
      items.map(item => ({
        item_id: item.productId,
        item_name: item.product.name,
        price: Number(item.product.price) || 0,
        quantity: item.quantity,
        item_variant: item.color || undefined
      })),
      'INR',
      calculateFinalTotal().finalTotal
    );

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

      // Update user's phone number if it's different from what's stored
      let validatedPhone = formData.phone;
      if (formData.phone && user.phone !== formData.phone) {
        try {
          // Basic validation for Indian phone numbers
          const phoneRegex = /^[6-9]\d{9}$/;
          const cleanPhone = formData.phone.replace(/\D/g, '');
          
          // If phone number starts with +91 or 91, remove it
          const formattedPhone = cleanPhone.replace(/^(\+?91)/, '');
          
          if (phoneRegex.test(formattedPhone)) {
            console.log('Updating user phone number from', user.phone, 'to', formattedPhone);
            await pocketbase.collection('users').update(user.id, {
              phone: formattedPhone
            });
            console.log('Phone number updated successfully');
            validatedPhone = formattedPhone;
          } else {
            console.warn('Invalid phone number format. Not updating user profile.');
          }
        } catch (phoneError) {
          console.error('Failed to update phone number:', phoneError);
          // Don't block order processing if phone update fails
        }
      }

      // Create or update address
      let addressId;
      try {
        const addressData = {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: 'India',
          user: user.id
        };

        // Try to find existing address
        const existingAddresses = await pocketbase.collection('addresses').getList(1, 1, {
          filter: `user = "${user.id}"`
        });

        if (existingAddresses.items.length > 0) {
          // Update existing address
          addressId = existingAddresses.items[0].id;
          await pocketbase.collection('addresses').update(addressId, addressData);
        } else {
          // Create new address
          const newAddress = await pocketbase.collection('addresses').create(addressData);
          addressId = newAddress.id;
        }
      } catch (error) {
        console.error('Error saving address:', error);
        throw new Error('Failed to save shipping address. Please try again.');
      }

      // Create order in PocketBase
      const orderData = {
        user: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: validatedPhone,
        shipping_address: addressId,
        products: items.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          color: item.color
        })),
        subtotal: subtotal,
        shipping_cost: calculateFinalTotal().shipping_cost,
        total: calculateFinalTotal().finalTotal,
        status: 'pending',
        payment_status: 'pending',
        coupon_code: appliedCoupon?.code,
        discount_amount: appliedCoupon?.discountAmount || 0
      };

      const order = await pocketbase.collection('orders').create(orderData) as unknown as OrderData;

      // Proceed with payment
      await handleNextSteps(order);

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

  const handleNextSteps = async (order: OrderData) => {
    // Create Razorpay order
    const razorpayOrderResponse = await createRazorpayOrder(
      order.total, // amount in INR with coupon discount applied
      'INR',  // currency
      order.id // receipt (using our order ID)
    );

    if (!razorpayOrderResponse || !razorpayOrderResponse.id) {
      throw new Error('Failed to create payment order. Please try again.');
    }

    // Open Razorpay payment form
    openRazorpayCheckout({
      key: getRazorpayKeyId(),
      amount: order.total * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Konipai',
      description: `Order #${order.id}`,
      image: import.meta.env.VITE_SITE_LOGO || 'https://konipai.in/assets/logo.png',
      handler: (response) => handlePaymentSuccess(response, order.id),
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: order.customer_phone, // Use the validated phone number from the order
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
            {appliedCoupon && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Discount ({appliedCoupon.code})</span>
                <span className="font-medium">-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 font-semibold">
              <span>Total</span>
              <span>₹{calculateFinalTotal().finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Coupon Code</h2>
          <div className="flex items-center space-x-3">
            <Input
              id="couponCode"
              name="couponCode"
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
            />
            {couponLoading ? (
              <Button disabled className="w-24">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </Button>
            ) : (
              <Button type="button" onClick={applyCoupon} className="w-24">
                Apply
              </Button>
            )}
            {appliedCoupon && (
              <Button type="button" onClick={removeCoupon} className="w-24">
                Remove
              </Button>
            )}
          </div>
          {couponError && (
            <p className="text-red-600">{couponError}</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payment Method</h2>
          <div className="flex items-center space-x-3 p-4 border rounded-md bg-gray-50">
            <img src="/razorpay-logo.svg" alt="Razorpay" className="h-8" onError={(e) => (e.currentTarget.src = 'https://razorpay.com/assets/razorpay-logo.svg')} />
            <div>
              <p className="font-medium">Pay with Razorpay</p>
              <p className="text-sm text-gray-500">Secure payment via Razorpay</p>
              {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_live') && (
                <p className="text-xs text-green-600 font-medium mt-1">Live payments enabled</p>
              )}
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
            {`Pay Now - ₹${calculateFinalTotal().finalTotal.toFixed(2)}`}
          </Button>
        )}
      </form>
    </div>
  );
}

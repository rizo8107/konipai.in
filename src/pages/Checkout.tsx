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
  verifyRazorpayPayment,
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

// Update interface to be compatible with PocketBase RecordModel
interface OrderData {
  id: string;
  [key: string]: any; // Allow any additional properties that might be on the record
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
      
      console.log('Payment success:', response);
      
      // Get payment ID from Razorpay response
      const paymentId = response.razorpay_payment_id;
      
      // Verify payment
      const verified = await verifyRazorpayPayment(
        paymentId,
        orderId
      );

      if (!verified) {
        throw new Error('Payment verification failed. Please contact support.');
      }

      // Update the order with payment status
      await pocketbase.collection('orders').update(orderId, {
        payment_id: paymentId,
        payment_status: 'captured', 
        status: 'processing'
      });

      // Track purchase completion with Google Analytics
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

      // Clear the cart after successful payment
      clearCart();
      
      // Navigate to order confirmation
      navigate(`/order-confirmation/${orderId}`);
      
    } catch (error) {
      console.error('Payment verification error:', error);
      
      // Try to update order with failed status
      try {
        if (orderId) {
          await pocketbase.collection('orders').update(orderId, {
            payment_status: 'failed',
            status: 'payment_failed'
          });
        }
      } catch (updateError) {
        console.error('Failed to update order status:', updateError);
      }
      
      toast({
        variant: "destructive",
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "We couldn't verify your payment. Please contact support.",
      });
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
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

      // Calculate final total with coupon discount
      const { finalTotal, shipping_cost } = calculateFinalTotal();
      
      // Create order - Basic version first without coupon fields
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
        total: finalTotal,
        shipping_cost,
        status: 'pending',
        shippingAddress: addressId, // Match PocketBase field name
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_status: 'pending',
      };

      // Only add coupon fields if they exist in schema
      try {
        // Attempt to create order with coupon fields
        if (appliedCoupon) {
          const order = await pocketbase.collection('orders').create({
            ...orderData,
            coupon_code: appliedCoupon.code,
            coupon_id: appliedCoupon.couponId,
            discount_amount: appliedCoupon.discountAmount,
          });
          return handleNextSteps(order);
        } else {
          const order = await pocketbase.collection('orders').create(orderData);
          return handleNextSteps(order);
        }
      } catch (error) {
        console.error('Failed to create order with coupon fields:', error);
        
        // If failed, try again without coupon fields
        const order = await pocketbase.collection('orders').create(orderData);
        
        // Log that coupon was applied but not saved to order
        if (appliedCoupon) {
          console.warn('Coupon was applied but not saved to order due to schema issue:', appliedCoupon);
        }
        
        return handleNextSteps(order);
      }
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

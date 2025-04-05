import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbase } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  loadRazorpayScript, 
  getRazorpayKeyId,
  RazorpayResponse
} from '@/lib/razorpay';
import { trackEcommerceEvent } from '@/utils/analytics';
import { 
  trackBeginCheckout, 
  trackAddShippingInfo, 
  trackAddPaymentInfo, 
  trackPaymentStart, 
  trackPaymentSuccess, 
  trackPaymentFailure,
  trackButtonClick,
  trackFormStart,
  trackFormCompletion,
  trackFormError,
  ProductItem
} from '@/lib/analytics';

import { CheckoutForm, CheckoutFormData } from '@/components/checkout/CheckoutForm';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { CouponSection } from '@/components/checkout/CouponSection';
import { PaymentSection } from '@/components/checkout/PaymentSection';

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
  customer_phone: string; // Ensuring phone is included
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
    phone: user?.phone || '', // Initialize with user's phone if available
  });
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [orderError, setOrderError] = useState<string | null>(null);

  // Check for live mode
  const isLiveMode = import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_live') || false;
  
  // Load Razorpay script
  useEffect(() => {
    const loadScript = async () => {
      const isLoaded = await loadRazorpayScript();
      setRazorpayLoaded(isLoaded);
      if (!isLoaded) {
        console.error('Failed to load Razorpay script');
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    
    loadScript();
  }, [toast]);

  // Redirect unauthenticated users or empty cart
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

    // Track begin checkout event
    if (items && items.length > 0) {
      trackBeginCheckout(cartItemsToProductItems(items), subtotal);
    }
    
    // Load user's address if available
    loadUserAddress();
    
    // Track form start
    trackFormStart('checkout', 'checkout-form');
    
  }, [user, items, cartLoading, navigate, toast, subtotal]);

  // Load user's default address if available
  const loadUserAddress = async () => {
    if (!user?.id) return;
    
    try {
      const addresses = await pocketbase
        .collection('addresses')
        .getList(1, 10, {
          filter: `user="${user.id}" && isDefault=true`,
        });
      
      if (addresses && addresses.items.length > 0) {
        const defaultAddress = addresses.items[0];
        
        setFormData(prev => ({
          ...prev,
          address: defaultAddress.street || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          zipCode: defaultAddress.postalCode || '',
          phone: defaultAddress.phone || prev.phone || '',
        }));
      }
    } catch (error) {
      console.warn('Failed to load user address:', error);
      // Non-critical error, don't show to user
    }
  };

  // Helper function to convert cart items to product items for analytics
  const cartItemsToProductItems = (items: any[]): ProductItem[] => {
    return items.map(item => ({
      item_id: item.productId,
      item_name: item.product.name,
      price: Number(item.product.price) || 0,
      quantity: item.quantity,
      item_variant: item.color || undefined
    }));
  };

  // Form change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Coupon validation function
  const validateCouponInFrontend = (code: string, currentSubtotal: number) => {
    // This is a simplified frontend validation
    // In a real app, you'd validate this server-side
    
    // For demo purposes, we'll use some hardcoded coupons
    const validCoupons = [
      {
        id: 'welcome10',
        code: 'WELCOME10',
        type: 'percentage' as const,
        amount: 10,
        minOrderValue: 0,
        maxDiscountAmount: 1000,
      },
      {
        id: 'summer20',
        code: 'SUMMER20',
        type: 'percentage' as const,
        amount: 20,
        minOrderValue: 100,
        maxDiscountAmount: 500,
      },
      {
        id: 'flat50',
        code: 'FLAT50',
        type: 'fixed_amount' as const,
        amount: 50,
        minOrderValue: 200,
      }
    ];
    
    const coupon = validCoupons.find(c => c.code === code.toUpperCase());
    
    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid coupon code'
      };
    }
    
    if (coupon.minOrderValue > currentSubtotal) {
      return {
        valid: false,
        error: `This coupon requires a minimum order of ₹${coupon.minOrderValue}`
      };
    }
    
    let discountAmount = 0;
    
    if (coupon.type === 'percentage') {
      discountAmount = (currentSubtotal * coupon.amount) / 100;
      
      // Apply max discount cap if exists
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.amount;
    }
    
    return {
      valid: true,
      coupon: {
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        amount: coupon.amount,
        discountAmount: discountAmount
      }
    };
  };

  // Apply coupon handler
  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const result = validateCouponInFrontend(couponCode, subtotal);
      
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        
        toast({
          title: 'Coupon Applied',
          description: `Discount of ₹${result.coupon.discountAmount.toFixed(2)} applied to your order.`,
        });
        
        // Track coupon application
        trackEcommerceEvent('add_coupon', [{
          coupon: result.coupon.code,
          discount: result.coupon.discountAmount
        }]);
      } else {
        setCouponError(result.error || 'Invalid coupon');
      }
      
      setCouponLoading(false);
    }, 800);
  };

  // Remove coupon handler
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    
    toast({
      title: 'Coupon Removed',
      description: 'The coupon has been removed from your order.',
    });
  };

  // Calculate final total
  const calculateFinalTotal = () => {
    // Calculate shipping cost (free over threshold)
    const SHIPPING_THRESHOLD = 100;
    const SHIPPING_COST = 10;
    
    const calculatedShippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    
    // Calculate discount amount
    let discountAmount = 0;
    if (appliedCoupon) {
      discountAmount = appliedCoupon.discountAmount;
    }
    
    // Calculate final total
    const finalTotal = subtotal + calculatedShippingCost - discountAmount;
    
    return {
      calculatedShippingCost,
      discountAmount,
      finalTotal: Math.max(0, finalTotal) // Ensure total is not negative
    };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: RazorpayResponse, orderId: string) => {
    setIsPaymentProcessing(true);
    
    try {
      // Update order payment status
      await pocketbase.collection('orders').update(orderId, {
        payment_status: 'paid',
        payment_id: response.razorpay_payment_id,
        payment_signature: response.razorpay_signature,
        status: 'processing'
      });
      
      // Track payment success
      trackPaymentSuccess(orderId, calculateFinalTotal().finalTotal, 'Razorpay', response.razorpay_payment_id);
      
      // Clear cart
      clearCart();
      
      // Navigate to order confirmation
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Error updating order after payment:', error);
      
      toast({
        title: 'Payment Recorded',
        description: 'Your payment was successful, but we had trouble updating your order. Please contact support if needed.',
        variant: 'default'
      });
      
      // Still navigate to confirmation as payment was successful
      navigate(`/order-confirmation/${orderId}`);
    } finally {
      setIsSubmitting(false);
      setIsPaymentProcessing(false);
    }
  };

  // Retry operation with exponential backoff
  const retryOperation = async <T,>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
        lastError = error;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
    throw lastError;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      console.log('Starting order creation process...');
      
      // Ensure user is authenticated
      if (!user || !pocketbase.authStore.isValid) {
        console.error('User not authenticated');
        setOrderError('Authentication error. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        user: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        products: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color || null,
          price: Number(item.product.price) || 0,
          name: item.product.name
        })),
        subtotal: subtotal,
        shipping_cost: calculateFinalTotal().calculatedShippingCost,
        total: calculateFinalTotal().finalTotal,
        status: 'pending',
        payment_status: 'pending',
        coupon: appliedCoupon ? appliedCoupon.couponId : null,
        discount_amount: appliedCoupon ? appliedCoupon.discountAmount : 0
      };

      console.log('Order data prepared:', JSON.stringify(orderData));

      // Create order with retry logic
      const createOrderWithRetry = async (retries = 3, delay = 1000) => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            console.log(`Creating order (attempt ${attempt + 1}/${retries})`);
            
            // Create order record
            const order = await pocketbase.collection('orders').create(orderData);
            console.log('Order created successfully:', order.id);
            return order;
          } catch (error: any) {
            console.error(`Order creation failed (attempt ${attempt + 1}/${retries}):`, error);
            
            // If this is a 400 error, log more details
            if (error.status === 400) {
              console.error('Validation error details:', error.data);
            }
            
            // If we have more retries, wait before trying again
            if (attempt < retries - 1) {
              // Exponential backoff
              const backoffDelay = delay * Math.pow(2, attempt);
              console.log(`Retrying in ${backoffDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else {
              throw error; // Re-throw the last error
            }
          }
        }
        throw new Error('Failed to create order after multiple attempts');
      };

      // Create the order
      const order = await createOrderWithRetry();

      // Track payment start
      trackPaymentStart(order.id, calculateFinalTotal().finalTotal, 'Razorpay');
      
      // Track add payment info
      trackAddPaymentInfo(
        cartItemsToProductItems(items), 
        calculateFinalTotal().finalTotal, 
        'Razorpay', 
        appliedCoupon?.code
      );
      
      // Create Razorpay order via Supabase function
      const supabaseEndpoint = 'https://crm-supabase.7za6uc.easypanel.host/functions/v1/create-order';
      
      const response = await fetch(supabaseEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(calculateFinalTotal().finalTotal * 100), // Amount in currency's smallest unit (paise)
          receipt: order.id,
          notes: {
            order_id: order.id,
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase function error:', errorText);
        throw new Error(`Failed to create payment order: ${response.status}`);
      }
      
      const razorpayOrder = await response.json();
      console.log('Razorpay order created:', razorpayOrder);
      
      // Open Razorpay checkout
      const options = {
        key: getRazorpayKeyId(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Konipai',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: (response: RazorpayResponse) => {
          handlePaymentSuccess(response, order.id);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsSubmitting(false);
            
            // Track payment failure on dismissal
            trackPaymentFailure(order.id, calculateFinalTotal().finalTotal, 'Razorpay', 'modal_dismissed');
            
            toast({
              title: 'Payment Cancelled',
              description: 'Your payment was cancelled. Your order is saved and you can complete it later.',
            });
          }
        }
      };
      
      // Initialize Razorpay
      const rzp = new window.Razorpay(options);
      
      // Add event listener for payment failure
      rzp.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        
        // Track payment failure
        trackPaymentFailure(order.id, calculateFinalTotal().finalTotal, 'Razorpay', response.error?.description || 'payment_failed');
        
        toast({
          title: 'Payment Failed',
          description: `${response.error?.description || 'Your payment failed. Please try again.'}`,
          variant: 'destructive'
        });
        
        setIsSubmitting(false);
      });
      
      // Open payment modal
      rzp.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'An error occurred during checkout. Please try again.';
      
      if (error.status === 400) {
        errorMessage = 'Invalid order data. Please check your information and try again.';
        console.error('Validation error details:', error.data);
      } else if (error.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setOrderError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode
    }));
    
    // Clear related errors
    setErrors(prev => ({
      ...prev,
      address: null,
      city: null,
      state: null,
      zipCode: null
    }));
  };

  // Calculate values for the summary
  const { calculatedShippingCost, discountAmount, finalTotal } = calculateFinalTotal();

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <Link to="/cart" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold mt-2">Checkout</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <CheckoutForm 
            formData={formData} 
            onChange={handleInputChange} 
            errors={errors} 
            onAddressSelect={handleAddressSelect} 
          />
          
          <CouponSection 
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
            couponLoading={couponLoading}
            couponError={couponError}
            hasAppliedCoupon={!!appliedCoupon}
          />
          
          <PaymentSection isLiveMode={isLiveMode} />
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Your personal data will be used to process your order, as described in our privacy policy.</span>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <CheckoutSummary 
              items={items}
              subtotal={subtotal}
              shippingCost={calculatedShippingCost}
              discountAmount={discountAmount}
              couponCode={appliedCoupon?.code}
              finalTotal={finalTotal}
            />
            
            {isSubmitting || isPaymentProcessing ? (
              <Button disabled className="w-full mt-4 py-6 text-lg">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isPaymentProcessing ? 'Processing Payment...' : 'Processing...'}
              </Button>
            ) : (
              <Button type="submit" className="w-full mt-4 py-6 text-lg">
                {`Pay Now - ₹${finalTotal.toFixed(2)}`}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

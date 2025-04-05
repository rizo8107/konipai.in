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
  }, [user, items, cartLoading, navigate, toast, subtotal]);

  // Load user address when available
  useEffect(() => {
    const loadUserAddress = async () => {
      if (!user?.id) return;

      try {
        // Update form with user data including phone number
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '' // Use user's phone number
        }));

        // Attempt to load default address
        const addressRecords = await pocketbase.collection('addresses').getList(1, 1, {
          filter: `user="${user.id}" && isDefault=true`
        });

        if (addressRecords.items.length > 0) {
          const defaultAddress = addressRecords.items[0];
          setFormData(prev => ({
            ...prev,
            address: defaultAddress.street || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            zipCode: defaultAddress.postalCode || '',
            // If the address has a phone and user doesn't, use it
            phone: prev.phone || defaultAddress.phone || '' 
          }));
        }
      } catch (error) {
        console.error('Failed to load user address:', error);
      }
    };

    loadUserAddress();
  }, [user]);

  // Helper function to convert cart items to product items for analytics
  const cartItemsToProductItems = (items: any[]): ProductItem[] => {
    return items.map(item => ({
      item_id: item.productId,
      item_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      item_variant: item.color || undefined,
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
  const validateCouponInFrontend = async (code: string, currentSubtotal: number) => {
    // This would typically call your backend to validate the coupon
    try {
      const couponsCollection = await pocketbase.collection('coupons').getList(1, 10, {
        filter: `code="${code}" && active=true`
      });
      
      if (couponsCollection.items.length === 0) {
        return { valid: false, error: 'Invalid coupon code' };
      }
      
      const coupon = couponsCollection.items[0];
      
      // Check if the coupon has expired
      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return { valid: false, error: 'This coupon has expired' };
      }
      
      // Check minimum order value if specified
      if (coupon.min_order_value && currentSubtotal < coupon.min_order_value) {
        return { 
          valid: false, 
          error: `This coupon requires a minimum order of ₹${coupon.min_order_value.toFixed(2)}` 
        };
      }
      
      // Calculate discount
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (currentSubtotal * coupon.amount) / 100;
        // Apply maximum discount if specified
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
      } else {
        // Fixed amount discount
        discountAmount = coupon.amount;
        // Ensure discount doesn't exceed subtotal
        if (discountAmount > currentSubtotal) {
          discountAmount = currentSubtotal;
        }
      }
      
      return { 
        valid: true, 
        couponData: {
          couponId: coupon.id,
          code: coupon.code,
          type: coupon.type,
          amount: coupon.amount,
          discountAmount
        }
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, error: 'Failed to validate coupon' };
    }
  };

  // Apply coupon handler
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    if (appliedCoupon) {
      setCouponError('A coupon is already applied');
      return;
    }
    
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const result = await validateCouponInFrontend(couponCode, subtotal);
      
      if (!result.valid) {
        setCouponError(result.error || 'Invalid coupon');
        setAppliedCoupon(null);
        return;
      }
      
      if (result.couponData) {
        setAppliedCoupon(result.couponData);
        toast({
          title: 'Coupon Applied',
          description: `Discount of ₹${result.couponData.discountAmount.toFixed(2)} applied to your order.`,
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon handler
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    toast({
      title: 'Coupon Removed',
      description: 'Coupon has been removed from your order.'
    });
  };

  // Calculate final total
  const calculateFinalTotal = () => {
    let finalSubtotal = subtotal;
    let discountAmount = 0;
    
    // Apply free shipping for orders over ₹100
    const calculatedShippingCost = subtotal >= 100 ? 0 : 10;
    
    // Apply coupon discount if available
    if (appliedCoupon) {
      discountAmount = appliedCoupon.discountAmount;
      finalSubtotal = Math.max(0, finalSubtotal - discountAmount);
    }
    
    const finalTotal = finalSubtotal + calculatedShippingCost;
    
    return {
      calculatedShippingCost,
      discountAmount,
      finalTotal
    };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: RazorpayResponse, orderId: string) => {
    try {
      setIsPaymentProcessing(true);
      
      console.log('Payment successful:', response);
      trackPaymentSuccess(orderId, response.razorpay_payment_id, finalTotal, 'Razorpay');
      
      // Update order with payment details
      await pocketbase.collection('orders').update(orderId, {
        payment_status: 'paid',
        payment_id: response.razorpay_payment_id,
        payment_order_id: response.razorpay_order_id,
        payment_signature: response.razorpay_signature
      });
      
      // Clear cart
      clearCart();
      
      // Show success message
      toast({
        title: 'Payment Successful',
        description: 'Your order has been placed successfully!',
      });
      
      // Redirect to confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast({
        title: 'Processing Error',
        description: 'Your payment was successful, but we had trouble processing your order. Please contact support.',
        variant: 'destructive'
      });
    } finally {
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razorpayLoaded) {
      toast({
        title: 'Payment Error',
        description: 'Payment gateway is not available. Please refresh the page.',
        variant: 'destructive'
      });
      return;
    }
    
    if (isSubmitting || isPaymentProcessing) {
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      trackFormError('checkout', 'checkout-form', 'Validation errors in form');
      toast({
        title: 'Form Error',
        description: 'Please fix the errors in the form before continuing.',
        variant: 'destructive'
      });
      return;
    }
    
    trackFormCompletion('checkout', 'checkout-form');
    setIsSubmitting(true);
    
    try {
      // Create shipping address string
      const addressString = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      
      // Final calculations
      const { finalTotal, calculatedShippingCost } = calculateFinalTotal();
      
      // Track add shipping info
      trackAddShippingInfo(
        cartItemsToProductItems(items), 
        finalTotal, 
        'standard', 
        appliedCoupon?.code
      );
      
      // Create order in PocketBase
      const orderData = {
        user: user?.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone, // Include phone number
        shipping_address: addressString,
        shipping_address_text: JSON.stringify({
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode
        }),
        products: items.map(item => ({
          productId: item.productId,
          product: {
            id: item.productId,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images
          },
          quantity: item.quantity,
          color: item.color || undefined
        })),
        products_json: JSON.stringify(items),
        subtotal: subtotal,
        shipping_cost: calculatedShippingCost,
        total: finalTotal,
        status: 'pending',
        payment_status: 'pending',
        coupon: appliedCoupon ? appliedCoupon.couponId : null,
        discount_amount: appliedCoupon ? appliedCoupon.discountAmount : 0
      };
      
      // Create order record
      const order = await pocketbase.collection('orders').create(orderData);
      console.log('Order created:', order);
      
      // Track payment start
      trackPaymentStart(order.id, finalTotal, 'Razorpay');
      
      // Track add payment info
      trackAddPaymentInfo(
        cartItemsToProductItems(items), 
        finalTotal, 
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
          amount: Math.round(finalTotal), // Amount in currency's smallest unit
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
            trackPaymentFailure(order.id, finalTotal, 'Razorpay', 'modal_dismissed');
            
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
        trackPaymentFailure(order.id, finalTotal, 'Razorpay', response.error?.description || 'payment_failed');
        
        toast({
          title: 'Payment Failed',
          description: `${response.error?.description || 'Your payment failed. Please try again.'}`,
          variant: 'destructive'
        });
        
        setIsSubmitting(false);
      });
      
      // Open payment modal
      rzp.open();
    } catch (error) {
      console.error('Error during checkout:', error);
      
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : 'An error occurred during checkout',
        variant: 'destructive'
      });
      
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

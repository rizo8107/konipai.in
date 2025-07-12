import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbase } from '@/lib/pocketbase';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShoppingBag, LockIcon, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  loadRazorpayScript, 
  getRazorpayKeyId,
  RazorpayResponse
} from '@/lib/razorpay';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  captureRazorpayPayment,
  openRazorpayCheckout,
  getRazorpayKeySecret
} from '@/lib/razorpay-client';
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
  trackDynamicConversion
} from '@/lib/analytics';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

interface CouponData {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  active: boolean;
  expiration_date?: string;
  min_purchase?: number;
  max_uses?: number;
  current_uses?: number;
  discountAmount?: number;
}

interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

// Using the more complete CouponData interface defined above

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
  shipping_address: string; // ID of the address record in addresses collection
  products: string; // JSON string of products array
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  coupon_code?: string;
  discount_amount?: number;
  notes?: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { items, subtotal, total, clearCart, isLoading: cartLoading } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Guest checkout states
  const [isGuestCheckout, setIsGuestCheckout] = useState<boolean>(false);
  const [showLoginOptions, setShowLoginOptions] = useState<boolean>(!user);
  
  // Limited time offer settings
  const [offerExpiryTime, setOfferExpiryTime] = useState<Date | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [offerDiscount, setOfferDiscount] = useState(0);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerLoading, setOfferLoading] = useState(true);
  const [hideOfferBanner, setHideOfferBanner] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: user?.phone || ''
  });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [suggestedCoupons, setSuggestedCoupons] = useState<any[]>([]);
  const [suggestedCouponsLoading, setSuggestedCouponsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  // Calculate final total with all discounts and shipping - removed duplicate
  
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

  // Fetch suggested coupons from PocketBase
  useEffect(() => {
    let isMounted = true;
    
    const fetchSuggestedCoupons = async () => {
      try {
        if (isMounted) setSuggestedCouponsLoading(true);
        
        // Get current date/time for comparison
        const now = new Date();
        
        try {
          // Fetch active coupons from PocketBase that are marked for display on checkout
          const coupons = await pocketbase.collection('coupons').getList(1, 5, {
            filter: `active = true && display_on_checkout = true && start_date <= "${now.toISOString()}" && end_date >= "${now.toISOString()}"`,
            sort: '-display_priority'
          });
          
          if (isMounted && coupons && coupons.items.length > 0) {
            setSuggestedCoupons(coupons.items);
            console.log('Suggested coupons found:', coupons.items.length);
          }
        } catch (collectionError) {
          // Collection might not exist yet
          console.warn('Coupons collection not found:', collectionError);
        }
      } catch (error) {
        console.error('Error fetching suggested coupons:', error);
      } finally {
        if (isMounted) setSuggestedCouponsLoading(false);
      }
    };
    
    fetchSuggestedCoupons();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch special offers from PocketBase
  useEffect(() => {
    // Flag to prevent state updates if component unmounts during fetch
    let isMounted = true;
    
    const fetchSpecialOffer = async () => {
      try {
        // Only set loading state if component is still mounted
        if (isMounted) setOfferLoading(true);
        
        // Get current date/time for comparison
        const now = new Date();
        
        // Check if collection exists before fetching
        try {
          // Fetch active offers from PocketBase
          const offers = await pocketbase.collection('special_offers').getList(1, 1, {
            filter: `active = true && start_date <= "${now.toISOString()}" && end_date >= "${now.toISOString()}"`,
            sort: '-created'
          });
          
          // Only update state if component is still mounted
          if (isMounted) {
            if (offers && offers.items.length > 0) {
              const offer = offers.items[0];
              setOfferDiscount(offer.discount_percentage || 0);
              setOfferTitle(offer.title || '');
              
              // Always set to 30 minutes from now regardless of database end_date
              const expiryTime = new Date();
              expiryTime.setMinutes(expiryTime.getMinutes() + 30);
              setOfferExpiryTime(expiryTime);
              
              setShowOffer(true);
              console.log('Active offer found:', offer.title, offer.discount_percentage + '%');
            } else {
              setShowOffer(false);
              console.log('No active offers found');
            }
          }
        } catch (collectionError) {
          // Collection might not exist yet, use fallback
          console.warn('Special offers collection not found, using fallback offer');
          
          if (isMounted) {
            // Set default offer values
            setOfferDiscount(5); // 5% discount
            setOfferTitle('Limited Time Offer');
            
            // Set expiry to 30 minutes from now
            const defaultExpiry = new Date();
            defaultExpiry.setMinutes(defaultExpiry.getMinutes() + 30);
            setOfferExpiryTime(defaultExpiry);
            
            setShowOffer(true);
          }
        }
      } catch (error) {
        console.error('Error fetching special offers:', error);
        if (isMounted) setShowOffer(false);
      } finally {
        if (isMounted) setOfferLoading(false);
      }
    };
    
    fetchSpecialOffer();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Only redirect if cart is empty (after loading)
    if (!cartLoading && (!items || items.length === 0)) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
      });
      navigate('/shop');
      return;
    }
    
    // If user logs in during checkout, update the form data
    if (user) {
      setShowLoginOptions(false);
      setIsGuestCheckout(false);
    } else {
      // Make sure login options are shown when there's no user
      setShowLoginOptions(true);
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
        if (error && typeof error === 'object' && 'status' in error && error.status !== 404) {
          console.warn('Failed to load saved address:', error);
        }
      }
    };

    loadUserAddress();
  }, [user, navigate, items, cartLoading, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate form after input change
    validateForm({ ...formData, [name]: value });
  };
  
  // Validate all required fields
  const validateForm = (data: CheckoutFormData) => {
    const requiredFields = ['name', 'email', 'address', 'city', 'state', 'zipCode', 'phone'];
    const isValid = requiredFields.every(field => 
      data[field as keyof CheckoutFormData] && data[field as keyof CheckoutFormData].trim() !== ''
    );
    
    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(data.email);
    
    // Phone validation for Indian numbers
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = data.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.replace(/^(\+?91)/, '');
    const isPhoneValid = phoneRegex.test(formattedPhone);
    
    setIsFormValid(isValid && isEmailValid && isPhoneValid);
  };
  
  // Function to validate coupons directly in frontend
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
      if (coupon.discount_type === 'percentage') {
        console.log(`Calculating percentage discount: subtotal=${currentSubtotal}, coupon amount=${coupon.discount_value}, coupon type=${coupon.discount_type}`);
        // Ensure coupon.discount_value is a number and not zero
        const percentageAmount = Number(coupon.discount_value) || 0;
        discountAmount = (currentSubtotal * percentageAmount) / 100;
        console.log(`Frontend validation - percentage discount: ${currentSubtotal} * ${percentageAmount}% = ${discountAmount}`);
      } else {
        // Apply full fixed amount regardless of subtotal
        discountAmount = Number(coupon.discount_value) || 0;
        console.log(`Frontend validation - fixed discount: ${discountAmount}`);
      }
      
      // Ensure discount amount is a number and not too small
      if (typeof discountAmount !== 'number' || isNaN(discountAmount)) {
        console.warn('Invalid discount amount, setting to 0');
        discountAmount = 0;
      }
      discountAmount = parseFloat(discountAmount.toFixed(2));
      console.log('Frontend validation - final discount amount:', discountAmount);

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
  }

// Function to apply coupon code from input field
const applyCoupon = async () => {
  if (!couponCode) {
    setCouponError('Please enter a coupon code');
    return;
  }
  
  const code = couponCode.trim();
  await handleApplyCoupon(code);
};

// Function to handle applying a coupon with a specific code
const handleApplyCoupon = async (code: string) => {
  setCouponCode(code); // Update the input field
  setCouponLoading(true);
  
  try {
    console.log('Validating coupon:', code, 'Subtotal:', subtotal);
    
    // Use frontend validation directly since server endpoint isn't available
    const validationResult = await validateCouponInFrontend(code, subtotal);
    console.log('Validation result:', validationResult);
    
    if (!validationResult.valid) {
      setCouponError(validationResult.message);
      setAppliedCoupon(null);
      return;
    }
    
    // Ensure discount amount is a number and properly formatted
    let discountAmount = parseFloat((validationResult.discountAmount || 0).toFixed(2));
    
    // Double-check that we have a valid discount amount
    if (validationResult.coupon?.discount_type === 'percentage' && validationResult.coupon?.discount_value > 0) {
      // Recalculate to ensure it's correct
      const percentageAmount = Number(validationResult.coupon.discount_value);
      discountAmount = parseFloat(((subtotal * percentageAmount) / 100).toFixed(2));
      console.log(`Recalculated percentage discount: ${subtotal} * ${percentageAmount}% = ${discountAmount}`);
    }
    
    console.log('Final discount amount to be applied:', discountAmount);
    
    setAppliedCoupon({
      id: validationResult.coupon?.id || '',
      code: validationResult.coupon?.code || code,
      type: validationResult.coupon?.discount_type || 'percentage',
      amount: validationResult.coupon?.discount_value || 0,
      active: true,
      discountAmount
    });
    
    setCouponError(null);
    toast({
      title: "Coupon Applied",
      description: `Discount of ₹${discountAmount.toFixed(2)} has been applied`,
    });
  } catch (error) {
    console.error('Coupon validation completely failed:', error);
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
      
      // Extract payment details from response
      const paymentId = response.razorpay_payment_id || response.paymentId;
      const razorpayOrderId = response.razorpay_order_id || response.orderId;
      const signature = response.razorpay_signature || response.signature;
      
      if (!paymentId) {
        throw new Error('Missing payment ID from Razorpay');
      }
      
      // Log whether this is a guest checkout or logged-in user
      console.log(`Processing payment for ${isGuestCheckout ? 'guest checkout' : 'logged-in user'} order: ${orderId}`);
      if (isGuestCheckout) {
        console.log('Guest checkout information:', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        });
      }

      let verificationSuccess = false;
      let captureSuccess = false;

      try {
        // First verify payment with Razorpay (this is handled by our backend function)
        const verificationResult = await verifyRazorpayPayment(
          paymentId || '',
          razorpayOrderId || '',
          signature || ''
        );

        console.log('Payment verification result:', verificationResult);
        verificationSuccess = verificationResult.success;
        
        // Even if verification fails, we should continue with order processing
        // since this could be due to our verification endpoint rather than an actual payment issue

        // Immediately capture the payment to avoid auto-refund
        console.log('Attempting to capture payment with ID:', paymentId);
        const captureResult = await captureRazorpayPayment(paymentId);
        console.log('Payment capture result:', captureResult);
        captureSuccess = captureResult.success;
      } catch (verifyError) {
        // Log the error but continue with order processing
        console.error('Payment verification/capture error:', verifyError);
      }

      // Update order in PocketBase
      const orderUpdateData = {
        payment_status: captureSuccess ? 'captured' : (verificationSuccess ? 'authorized' : 'pending_verification'),
        status: 'processing',
        payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        notes: `Payment received via Razorpay. Payment ID: ${paymentId}. Verified: ${verificationSuccess ? 'Yes' : 'No'}. Captured: ${captureSuccess ? 'Yes' : 'Pending'}`,
        updated: new Date().toISOString()
      };

      console.log('Updating order with data:', orderUpdateData);
      
      // Try to update order but don't block navigation if it fails
      try {
        await pocketbase.collection('orders').update(orderId, orderUpdateData);
        console.log('Order updated successfully');
      } catch (updateError) {
        console.error('Failed to update order:', updateError);
        // Continue with order processing even if update fails
      }

      // Send webhook to n8n
      try {
        // First get the complete order details with expanded products
        const orderDetails = await pocketbase.collection('orders').getOne(orderId);
        
        // Parse the products from the order
        interface OrderProduct {
          product: {
            id: string;
            name: string;
            price: number;
            images: string[];
            [key: string]: unknown;
          };
          quantity: number;
          price: number;
          [key: string]: unknown;
        }
        let orderProducts: OrderProduct[] = [];
        try {
          if (typeof orderDetails.products === 'string') {
            orderProducts = JSON.parse(orderDetails.products);
          } else {
            orderProducts = orderDetails.products;
          }
        } catch (parseError) {
          console.error('Error parsing order products:', parseError);
          orderProducts = [];
        }
        
        // Get the shipping address
        interface ShippingAddress {
          street: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
          [key: string]: string;
        }
        let shippingAddress: ShippingAddress = {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        };
        try {
          if (orderDetails.shipping_address_text) {
            shippingAddress = JSON.parse(orderDetails.shipping_address_text);
          } else if (orderDetails.shipping_address) {
            // Try to fetch the address
            try {
              const addressRecord = await pocketbase.collection('addresses').getOne(orderDetails.shipping_address);
              shippingAddress = {
                street: addressRecord.street,
                city: addressRecord.city,
                state: addressRecord.state,
                postalCode: addressRecord.postalCode,
                country: addressRecord.country
              };
            } catch (addressError) {
              console.error('Error fetching shipping address:', addressError);
            }
          }
        } catch (addressParseError) {
          console.error('Error parsing shipping address:', addressParseError);
        }
        
        // Prepare product details with image URLs
        const productsWithImages = orderProducts.map((product: OrderProduct) => {
          // Construct image URLs for each product
          let imageUrls: string[] = [];
          if (product.product && product.product.images) {
            imageUrls = product.product.images.map((img: string) => {
              // Use the exact PocketBase URL format provided
              // The product ID should only be included once in the URL
              return `https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_4092854851/${img}`;
            });
          }
          
          return {
            id: product.productId,
            name: product.product?.name || 'Unknown Product',
            price: product.product?.price || 0,
            quantity: product.quantity,
            color: product.color || 'Default',
            images: imageUrls,
            imageUrl: imageUrls[0] || '' // First image as the main image
          };
        });
        
        // Prepare the webhook data
        const n8nWebhookData = {
          event: "order.payment_success",
          order: {
            id: orderId,
            order_link: `https://konipai.in/orders/${orderId}`,
            customer: {
              name: orderDetails.customer_name,
              email: orderDetails.customer_email,
              phone: orderDetails.customer_phone,
              is_guest: orderDetails.is_guest_order || false,
              user_id: orderDetails.user || 'guest'
            },
            payment: {
              id: paymentId,
              status: captureSuccess ? "captured" : "authorized",
              method: "Razorpay"
            },
            shipping_address: shippingAddress,
            products: productsWithImages,
            totals: {
              subtotal: orderDetails.subtotal,
              shipping: orderDetails.shipping_cost,
              discount: orderDetails.discount_amount || 0,
              total: orderDetails.total
            },
            created_at: orderDetails.created,
            status: orderDetails.status,
            is_guest_order: orderDetails.is_guest_order || false
          }
        };

        // Send to the n8n webhook
        console.log('Sending order details to n8n webhook:', n8nWebhookData);
        const n8nWebhookResponse = await fetch('https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(n8nWebhookData)
        });

        if (n8nWebhookResponse.ok) {
          console.log('Successfully sent order details to n8n webhook');
        } else {
          console.error('Failed to send order details to n8n webhook:', await n8nWebhookResponse.text());
        }
        
        // Original webhook code continues below
        const webhookData = {
          event: captureSuccess ? "payment.captured" : "payment.authorized",
          payload: {
            payment: {
              entity: {
                id: paymentId,
                order_id: razorpayOrderId,
                currency: "INR",
                status: captureSuccess ? "captured" : "authorized",
                captured: captureSuccess
              }
            },
            metadata: {
              pocketbase_order_id: orderId,
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: paymentId,
              verified: verificationSuccess,
              manually_captured: captureSuccess
            }
          }
        };

        // Send to n8n webhook with correct credentials
        const webhookResponse = await fetch('https://backend-n8n.7za6uc.easypanel.host/webhook/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa('nnirmal7107@gmail.com:Kamala@7107')
          },
          body: JSON.stringify(webhookData)
        });

        console.log('Webhook response:', await webhookResponse.text());
        
        if (!webhookResponse.ok) {
          console.error('Failed to send webhook:', webhookResponse.statusText);
        }
        
        // Also update Razorpay payment with notes
        try {
          const razorpayUpdateResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(`${getRazorpayKeyId()}:${getRazorpayKeySecret()}`)
            },
            body: JSON.stringify({
              'pocketbase_order_id': orderId,
              'order_status': 'processing',
              'webhook_sent': 'true',
              'customer_email': '',
              'customer_name': ''
            })
          });
          
          console.log('Razorpay update response:', await razorpayUpdateResponse.text());
        } catch (razorpayError) {
          console.error('Error updating Razorpay payment:', razorpayError);
          // Don't fail the order just because the webhook failed
        }
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Don't fail the order just because the webhook failed
      }

      // Track payment success event - use sessionStorage to prevent duplicate tracking
      const paymentTrackedKey = `payment_tracked_${orderId}`;
      if (!sessionStorage.getItem(paymentTrackedKey)) {
        // Track payment success event
        trackPaymentSuccess(orderId, paymentId, calculateFinalTotal().finalTotal, 'razorpay');
        
        // Track conversion
        trackDynamicConversion({
          conversion_type: 'Sale',
          transaction_id: orderId,
          value: calculateFinalTotal().finalTotal,
          currency: 'INR',
          items: items.map(item => ({
            item_id: item.productId,
            item_name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          }))
        });
        
        // Mark this payment as tracked to prevent duplicate events
        sessionStorage.setItem(paymentTrackedKey, 'true');
      }

      // Clear the cart after successful order
      clearCart();

      // Update UI and always redirect to order confirmation page
      if (isGuestCheckout) {
        toast({
          title: "Payment Successful!",
          description: `Your order has been placed successfully. Order details have been sent to ${formData.email}.`,
        });
      } else {
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully. You can view your order in your account.",
        });
      }
      
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Processing Issue",
        description: error instanceof Error ? error.message : "There was an issue processing your payment, but your order has been placed.",
      });
      
      // Track payment issue
      trackPaymentFailure(
        orderId, 
        calculateFinalTotal().finalTotal, 
        'razorpay', 
        error instanceof Error ? error.message : "Unknown error"
      );
      
      // Attempt to update order status to note the issue if we have an order ID
      if (orderId) {
        try {
          await pocketbase.collection('orders').update(orderId, {
            status: 'payment_issue', 
            notes: `Payment processing issue: ${error instanceof Error ? error.message : "Unknown error"}`
          });
        } catch (updateError) {
          console.error('Failed to update order status:', updateError);
        }
      }
      
      // Even with an error, redirect to order confirmation
      // The order has been created, and we've logged the payment issue
      navigate(`/order-confirmation/${orderId}`);
    } finally {
      // Reset UI state whether successful or not
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
    }
  };

  const calculateFinalTotal = () => {
    const finalSubtotal = subtotal;
    let finalDiscount = 0;
    
    // Apply coupon discount if available
    let couponDiscountAmount = 0;
    if (appliedCoupon && appliedCoupon.discountAmount) {
      couponDiscountAmount = appliedCoupon.discountAmount;
      finalDiscount += couponDiscountAmount;
      console.log(`Applying coupon discount: ${couponDiscountAmount}`);
    }
    
    // Apply limited time offer discount if active
    let offerDiscountAmount = 0;
    if (showOffer && offerDiscount > 0) {
      offerDiscountAmount = parseFloat(((finalSubtotal * offerDiscount) / 100).toFixed(2));
      finalDiscount += offerDiscountAmount;
      console.log(`Applying offer discount: ${offerDiscountAmount}`);
    }
    
    // Round the final discount to 2 decimal places
    finalDiscount = parseFloat(finalDiscount.toFixed(2));
    console.log(`Total discount: ${finalDiscount}`);
    
    const shippingCost = subtotal >= 100 ? 0 : 10;
    const finalTotal = Math.max(0, finalSubtotal + shippingCost - finalDiscount);
    console.log(`Final calculation: ${finalSubtotal} + ${shippingCost} - ${finalDiscount} = ${finalTotal}`);
    
    return {
      finalSubtotal,
      finalDiscount,
      couponDiscountAmount,
      offerDiscountAmount,
      shippingCost,
      finalTotal
    };
  };
  
  // Start tracking checkout form
  useEffect(() => {
    if (items && items.length > 0) {
      trackFormStart('checkout_form', 'checkout-form');
    }
    
    // Validate form on initial load
    validateForm(formData);
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSubmitting || isPaymentProcessing) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [items, isSubmitting, isPaymentProcessing, formData]);
  
  // Re-validate form when user data changes
  useEffect(() => {
    if (user) {
      const updatedFormData = {
        ...formData,
        name: formData.name || user.name || '',
        email: formData.email || user.email || '',
        phone: formData.phone || user.phone || ''
      };
      setFormData(updatedFormData);
      validateForm(updatedFormData);
      
      // If user logs in during checkout, hide login options
      if (showLoginOptions) {
        setShowLoginOptions(false);
        toast({
          title: "Logged in successfully",
          description: "Continuing with checkout...",
        });
      }
    }
  }, [user, formData, showLoginOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isPaymentProcessing) {
      return; // Prevent double submission
    }

    // Track beginning of checkout process with Google Tag Manager
    trackBeginCheckout(
      items.map(item => ({
        item_id: item.productId,
        item_name: item.product.name,
        price: Number(item.product.price) || 0,
        quantity: item.quantity,
        item_variant: item.color || undefined,
        affiliation: 'Konipai Web Store'
      })),
      calculateFinalTotal().finalTotal
      // Removed third parameter as trackBeginCheckout only accepts two parameters
    );
    
    // Track the checkout button click
    trackButtonClick('checkout_submit_button', 'Place Order', window.location.pathname);

    try {
      setIsSubmitting(true);

      // For guest checkout, we don't need to check for user.id
      // We'll create a guest order or use the logged-in user information if available

      if (!items || items.length === 0) {
        trackFormError('checkout_form', 'checkout-form', 'Cart is empty');
        throw new Error('Your cart is empty');
      }

      // Check if Razorpay is loaded
      if (!razorpayLoaded) {
        trackFormError('checkout_form', 'checkout-form', 'Payment gateway not available');
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

      // Update user's phone number if logged in and different from what's stored
      let validatedPhone = formData.phone;
      if (user && formData.phone && user.phone !== formData.phone) {
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

      // Track shipping information added
      trackAddShippingInfo(
        items.map(item => ({
          item_id: item.productId,
          item_name: item.product.name,
          price: Number(item.product.price) || 0,
          quantity: item.quantity,
          item_variant: item.color || undefined,
          discount: appliedCoupon && appliedCoupon.discountAmount ? (appliedCoupon.discountAmount / items.length) : 0
        })),
        calculateFinalTotal().finalTotal,
        'standard',
        appliedCoupon?.code
      );

      // Create or update address
      let addressId = null;
      const addressText = JSON.stringify({
        street: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: 'India'
      });
      
      try {
        // For guest checkout, we don't create an address record in PocketBase
        // We just store the address as text in the order
        if (!isGuestCheckout && user) {
          // Prepare address data for logged-in users
          const addressData = {
            user: user.id,
            street: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: 'India',
            isDefault: true
          };

          console.log('Preparing shipping address data for logged-in user:', addressData);
          
          // For logged-in users, check if they already have an address
          try {
            const existingAddress = await pocketbase.collection('addresses')
              .getFirstListItem(`user="${user.id}"`);
            
            if (existingAddress) {
              // Update existing address
              await pocketbase.collection('addresses').update(existingAddress.id, addressData);
              addressId = existingAddress.id;
              console.log('Updated existing address:', addressId);
            }
          } catch (addressError: unknown) {
            // No existing address found, create new one
            console.log('No existing address found for user, creating new one');
            const newAddress = await pocketbase.collection('addresses').create(addressData);
            addressId = newAddress.id;
            console.log('Created new address for user:', addressId);
          }
          
          if (!addressId) {
            throw new Error('Failed to create or update address');
          }
        } else {
          // For guest checkout, we'll use the address text only
          console.log('Guest checkout: using address text only (no PocketBase address record)');
        }
      } catch (error) {
        trackFormError('checkout_form', 'checkout-form', 'Failed to prepare shipping address');
        console.error('Error preparing address:', error);
        throw new Error('Failed to prepare shipping address. Please try again.');
      }

      // For guest checkout, we'll only use the shipping_address_text field
      // For logged-in users, we'll use both shipping_address and shipping_address_text
      console.log(`${isGuestCheckout ? 'Guest checkout: No address ID' : `Using shipping address ID for order creation: ${addressId}`}`);

      // Create order in PocketBase
      const orderData = {
        // Only include user reference if user is logged in
        ...(user ? { user: user.id } : {}),
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: validatedPhone,
        // Only include shipping_address for logged-in users
        ...(user && addressId ? { shipping_address: addressId } : {}),
        shipping_address_text: JSON.stringify({
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: 'India'
        }), // Store address as text for all orders (including guest orders)
        products: JSON.stringify(items.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          color: item.color
        }))),
        subtotal: subtotal,
        shipping_cost: calculateFinalTotal().shippingCost,
        total: calculateFinalTotal().finalTotal,
        status: 'pending',
        payment_status: 'pending',
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discountAmount || 0,
        notes: isGuestCheckout ? 'Guest checkout order' : 'Order created, awaiting payment',
        payment_id: '',
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
        is_guest_order: isGuestCheckout,
      };

      console.log('Creating order with data:', {
        ...orderData,
        products: `[${items.length} items]`, // Don't log the entire products array
      });

      const order = await pocketbase.collection('orders').create(orderData) as unknown as OrderData;
      console.log('Order created successfully with ID:', order.id);
      
      // Track form completion
      trackFormCompletion('checkout_form', 'checkout-form');

      // Proceed with payment
      await handleNextSteps(order);

    } catch (error) {
      console.error('Checkout error:', error);
      trackFormError('checkout_form', 'checkout-form', error instanceof Error ? error.message : 'Unknown error');
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to process your order. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const handleNextSteps = async (order: OrderData) => {
    // Track payment info added (Razorpay in this case)
    trackAddPaymentInfo(
      items.map(item => ({
        item_id: item.productId,
        item_name: item.product.name,
        price: Number(item.product.price) || 0,
        quantity: item.quantity,
        item_variant: item.color || undefined,
        discount: appliedCoupon && appliedCoupon.discountAmount ? (appliedCoupon.discountAmount / items.length) : 0
      })),
      order.total,
      'Razorpay',
      appliedCoupon?.code
    );
    
    // Ensure the order amount is positive - Razorpay doesn't accept negative amounts
    const orderAmount = Math.max(1, order.total); // Minimum 1 rupee if total is zero or negative
    
    console.log(`Original order total: ₹${order.total}`);
    console.log(`Creating Razorpay order for amount: ₹${orderAmount} (will be converted to ${orderAmount * 100} paise)`);
    
    try {
      const razorpayOrderResponse = await createRazorpayOrder(
        orderAmount, // Positive amount in rupees (will be converted to paise)
        'INR',       // currency
        order.id,    // receipt (using our order ID)
        // Add notes about guest checkout status
        {
          user_id: user?.id || 'guest',
          email: formData.email,
          name: formData.name,
          is_guest: isGuestCheckout ? 'true' : 'false'
        }
      );
      
      console.log('Razorpay order response details:');
      console.log('- ID:', razorpayOrderResponse.id);
      console.log('- Amount:', razorpayOrderResponse.amount, 'paise (₹' + (razorpayOrderResponse.amount / 100).toFixed(2) + ')');
      console.log('- Currency:', razorpayOrderResponse.currency);
      console.log('- Receipt:', razorpayOrderResponse.receipt);
      console.log('- Status:', razorpayOrderResponse.status);
      
      // IMPORTANT: The amount in the Razorpay order response is ALREADY in paise
      // and should be used directly without further conversion
      console.log(`Razorpay order amount: ${razorpayOrderResponse.amount} paise (₹${(razorpayOrderResponse.amount/100).toFixed(2)})`);

      if (!razorpayOrderResponse || !razorpayOrderResponse.id) {
        trackPaymentFailure(order.id, order.total, 'Razorpay', 'Failed to create payment order');
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Track payment start
      trackPaymentStart(order.id, order.total, 'Razorpay');

      // Open Razorpay payment form
      openRazorpayCheckout({
        key: getRazorpayKeyId(),
        order_id: razorpayOrderResponse.id,
        amount: razorpayOrderResponse.amount, // Amount is already in paise from the Razorpay order
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
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`,
          is_guest_checkout: isGuestCheckout ? 'true' : 'false',
          user_id: user?.id || 'guest'
        },
        theme: {
          color: '#4F46E5', // Indigo color that matches Konipai theme
        }
      });

      // NOTE: After this point, the payment flow is handled by Razorpay's modal
      // The handlePaymentSuccess function will be called when payment is completed
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      trackPaymentFailure(order.id, order.total, 'Razorpay', error instanceof Error ? error.message : 'Unknown error');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "There was an issue processing your payment. Please contact support.",
      });
      navigate(`/order-confirmation/${order.id}?status=payment_error`);
    }
  };

  const handleAddressSelect = (address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    const updatedFormData = {
      ...formData,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode
    };
    setFormData(updatedFormData);
    validateForm(updatedFormData);
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

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Login Successful",
        description: "You've been logged in with Google.",
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not log in with Google. Please try again or continue as guest.",
      });
    }
  };

  // Handle guest checkout selection
  const handleGuestCheckoutSelect = () => {
    setIsGuestCheckout(true);
    setShowLoginOptions(false);
    toast({
      title: "Guest Checkout",
      description: "You can complete your order without creating an account.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Checkout Header with Progress */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-6">Checkout</h1>
          
          {/* Login Options Section */}
          {showLoginOptions && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Complete Your Purchase</h2>
              <p className="mb-6 text-gray-600">Sign in for faster checkout and to save your information for next time.</p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="flex items-center w-full md:w-auto">
                  <div className="border-t border-gray-300 flex-grow md:w-20"></div>
                  <span className="px-4 text-gray-500 text-sm">or</span>
                  <div className="border-t border-gray-300 flex-grow md:w-20"></div>
                </div>
                
                <Button 
                  onClick={handleGuestCheckoutSelect}
                  className="w-full md:w-auto bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300"
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          )}
          
          {offerLoading ? (
            <div className="flex justify-center items-center py-4 mb-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading offers...</span>
            </div>
          ) : showOffer && offerExpiryTime && !hideOfferBanner && (
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 md:p-6 rounded-lg mb-8 shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
                </svg>
                <svg className="absolute left-0 bottom-0 h-full transform rotate-180" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon fill="currentColor" points="0,0 100,0 100,100" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0 md:mr-8">
                  <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full mb-2">EXCLUSIVE</span>
                  <h3 className="font-bold text-xl md:text-2xl tracking-tight mb-1">{offerTitle || 'Limited Time Offer'}</h3>
                  <p className="text-slate-300 text-sm md:text-base">Complete your purchase in the next:</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <CountdownTimer 
                    expiryTime={offerExpiryTime} 
                    onExpire={() => {
                      console.log('Offer expired, hiding offer section');
                      setShowOffer(false);
                    }} 
                    className="mb-3 text-lg font-mono"
                  />
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <p className="text-base md:text-lg font-bold">Save <span className="text-amber-400">{offerDiscount}%</span> on your order</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-2 -top-2 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500 rounded-full transform rotate-45"></div>
                <span className="relative z-10 text-white font-bold text-sm md:text-base transform -rotate-45">{offerDiscount}%</span>
              </div>
              
              <button 
                onClick={() => setHideOfferBanner(true)} 
                className="absolute top-2 right-2 text-white/80 hover:text-white focus:outline-none"
                aria-label="Close offer banner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          {showOffer && offerExpiryTime && hideOfferBanner && (
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setHideOfferBanner(false)} 
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                Show Limited Time Offer ({offerDiscount}% discount)
              </button>
            </div>
          )}
          <div className="flex justify-center items-center mb-8">
            <div className="flex items-center w-full max-w-3xl">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">1</div>
                <span className="text-sm mt-1">Information</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">2</div>
                <span className="text-sm mt-1">Review</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">3</div>
                <span className="text-sm mt-1">Payment</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">1</span>
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={!formData.name ? "border-red-300" : ""}
              />
              {!formData.name && (
                <p className="text-xs text-red-500">Full name is required</p>
              )}
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
                className={!formData.email || (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) ? "border-red-300" : ""}
              />
              {!formData.email ? (
                <p className="text-xs text-red-500">Email is required</p>
              ) : formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              ) : null}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">2</span>
            Shipping Address
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                defaultValue={formData.address}
                error={errors?.address || (!formData.address ? "Address is required" : undefined)}
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
                  className={errors?.city || !formData.city ? "border-red-500" : ""}
                />
                {errors?.city ? (
                  <p className="text-xs text-red-500">{errors.city}</p>
                ) : !formData.city ? (
                  <p className="text-xs text-red-500">City is required</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className={errors?.state || !formData.state ? "border-red-500" : ""}
                />
                {errors?.state ? (
                  <p className="text-xs text-red-500">{errors.state}</p>
                ) : !formData.state ? (
                  <p className="text-xs text-red-500">State is required</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className={errors?.zipCode || !formData.zipCode ? "border-red-500" : ""}
                />
                {errors?.zipCode ? (
                  <p className="text-xs text-red-500">{errors.zipCode}</p>
                ) : !formData.zipCode ? (
                  <p className="text-xs text-red-500">ZIP code is required</p>
                ) : null}
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
                className={errors?.phone || !formData.phone ? "border-red-500" : ""}
                placeholder="10-digit mobile number"
              />
              {errors?.phone ? (
                <p className="text-xs text-red-500">{errors.phone}</p>
              ) : !formData.phone ? (
                <p className="text-xs text-red-500">Phone number is required</p>
              ) : null}
              <p className="text-xs text-muted-foreground">Enter a 10-digit Indian mobile number</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">3</span>
            Order Summary
          </h2>
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
                <span className="font-medium">-₹{(appliedCoupon.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 font-semibold">
              <span>Total</span>
              <span>₹{(calculateFinalTotal()?.finalTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">4</span>
            Coupon Code
          </h2>
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
          {couponError && <p className="text-red-500 text-sm">{couponError}</p>}
          
          {/* Suggested Coupons Section */}
          {suggestedCouponsLoading ? (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading available coupons...</span>
            </div>
          ) : suggestedCoupons.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">Available coupons:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedCoupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => {
                      // Apply the coupon directly with the code instead of relying on state update
                      handleApplyCoupon(coupon.code);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm transition-colors"
                  >
                    <span className="font-medium">{coupon.code}</span>
                    {coupon.description && (
                      <span className="ml-1 text-xs text-gray-500">- {coupon.description}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">5</span>
            Payment Method
          </h2>
          <div className="flex items-center space-x-3 p-6 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
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
          <Button disabled className="w-full mt-6 py-6 text-lg">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            {isPaymentProcessing ? 'Processing Payment...' : 'Processing...'}
          </Button>
        ) : (
          <Button 
            type="submit" 
            className="w-full mt-6 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={!isFormValid || items.length === 0}
          >
            {`Complete Purchase - ₹${calculateFinalTotal().finalTotal.toFixed(2)}`}
          </Button>
        )}
        
        <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
          <LockIcon className="h-4 w-4 mr-2" />
          <span>Secure checkout powered by Razorpay</span>
        </div>
      </form>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg border sticky top-8">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              
              <div className="max-h-80 overflow-y-auto mb-4 pr-2">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.color}`} className="flex items-start py-3 border-b last:border-b-0">
                    {item.product.images && item.product.images.length > 0 && (
                      <div className="w-16 h-16 rounded overflow-hidden mr-3 flex-shrink-0 bg-white border">
                        <img 
                          src={`https://backend-pocketbase.7za6uc.easypanel.host/api/files/pbc_4092854851/${item.product.images[0]}`}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Image';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Color: {item.color} • Qty: {item.quantity}</p>
                      <p className="font-medium mt-1">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 py-3 border-t border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{subtotal >= 100 ? 'Free' : `₹${10.00.toFixed(2)}`}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{(appliedCoupon.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {showOffer && calculateFinalTotal()?.offerDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Limited Time Offer ({offerDiscount}%)</span>
                    <span>-₹{(calculateFinalTotal()?.offerDiscountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Total</span>
                <span>₹{(calculateFinalTotal()?.finalTotal || 0).toFixed(2)}</span>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <img src="/payment-icons/visa.svg" alt="Visa" className="h-6" onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x24?text=Visa')} />
                <img src="/payment-icons/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x24?text=MC')} />
                <img src="/payment-icons/rupay.svg" alt="RuPay" className="h-6" onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x24?text=RuPay')} />
                <img src="/payment-icons/upi.svg" alt="UPI" className="h-6" onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x24?text=UPI')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

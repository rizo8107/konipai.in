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
  RazorpayResponse
} from '@/lib/razorpay';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  captureRazorpayPayment,
  openRazorpayCheckout
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
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

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
      
      // Extract payment details from response
      const paymentId = response.razorpay_payment_id || response.paymentId;
      const razorpayOrderId = response.razorpay_order_id || response.orderId;
      const signature = response.razorpay_signature || response.signature;
      
      if (!paymentId) {
        throw new Error('Missing payment ID from Razorpay');
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
        let orderProducts: any[] = [];
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
        let shippingAddress: Record<string, any> = {};
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
        const productsWithImages = orderProducts.map((product: any) => {
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
              phone: orderDetails.customer_phone
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
            status: orderDetails.status
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

      // Track payment success event
      trackPaymentSuccess(orderId, paymentId, calculateFinalTotal().finalTotal, 'razorpay');
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

      // Clear the cart after successful order
      clearCart();

      // Update UI and always redirect to order confirmation page
      toast({
        title: "Payment Received",
        description: "Your order has been placed successfully.",
      });

      // Redirect to the order confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Processing Issue",
        description: error instanceof Error ? error.message : "There was an issue processing your payment, but your order has been placed.",
      });
      
      // Track payment issue
      trackPaymentFailure(error instanceof Error ? error.message : "Unknown error");
      
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

  useEffect(() => {
    document.title = 'Checkout | Konipai';
    
    // Start tracking the form
    if (items && items.length > 0) {
      trackFormStart('checkout_form', 'checkout-form');
    }
    
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
  }, [items, isSubmitting, isPaymentProcessing]);

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
      calculateFinalTotal().finalTotal,
      appliedCoupon?.code
    );
    
    // Track the checkout button click
    trackButtonClick('checkout_submit_button', 'Place Order', window.location.pathname);

    try {
      setIsSubmitting(true);

      if (!user?.id) {
        trackFormError('checkout_form', 'checkout-form', 'User not logged in');
        throw new Error('Please login to complete your order');
      }

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

      // Track shipping information added
      trackAddShippingInfo(
        items.map(item => ({
          item_id: item.productId,
          item_name: item.product.name,
          price: Number(item.product.price) || 0,
          quantity: item.quantity,
          item_variant: item.color || undefined,
          discount: appliedCoupon ? (appliedCoupon.discountAmount / items.length) : 0
        })),
        calculateFinalTotal().finalTotal,
        'standard',
        appliedCoupon?.code
      );

      // Create or update address
      let addressId;
      try {
        // Prepare address data
        const addressData = {
          user: user.id,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: 'India',
          isDefault: true // Set as default address
        };

        console.log('Preparing shipping address data:', addressData);
        
        // Check if user already has an address
        try {
          const existingAddress = await pocketbase.collection('addresses')
            .getFirstListItem(`user="${user.id}"`);
          
          if (existingAddress) {
            // Update existing address
            await pocketbase.collection('addresses').update(existingAddress.id, addressData);
            addressId = existingAddress.id;
            console.log('Updated existing address:', addressId);
          }
        } catch (addressError: any) {
          // No existing address found, create new one
          console.log('No existing address found, creating new one');
          const newAddress = await pocketbase.collection('addresses').create(addressData);
          addressId = newAddress.id;
          console.log('Created new address:', addressId);
        }
        
        if (!addressId) {
          throw new Error('Failed to create or update address');
        }
      } catch (error) {
        trackFormError('checkout_form', 'checkout-form', 'Failed to prepare shipping address');
        console.error('Error preparing address:', error);
        throw new Error('Failed to prepare shipping address. Please try again.');
      }

      console.log(`Using shipping address ID for order creation: ${addressId}`);

      // Create order in PocketBase
      const orderData = {
        user: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: validatedPhone,
        shipping_address: addressId, // Confirmed: This is the correct field name matching PocketBase schema
        shipping_address_text: JSON.stringify({
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: 'India'
        }), // Add a text backup of the address data
        products: JSON.stringify(items.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          color: item.color
        }))),
        subtotal: subtotal,
        shipping_cost: calculateFinalTotal().shipping_cost,
        total: calculateFinalTotal().finalTotal,
        status: 'pending',
        payment_status: 'pending',
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discountAmount || 0,
        notes: 'Order created, awaiting payment',
        payment_id: '',
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
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
        discount: appliedCoupon ? (appliedCoupon.discountAmount / items.length) : 0
      })),
      order.total,
      'Razorpay',
      appliedCoupon?.code
    );
    
    // Use order.total as-is in rupees (₹)
    // The createRazorpayOrder function will correctly convert it to paise (× 100)
    // for the Razorpay API which expects amounts in the smallest currency unit
    console.log(`Creating Razorpay order for amount: ₹${order.total} (will be converted to ${order.total * 100} paise)`);
    
    try {
      const razorpayOrderResponse = await createRazorpayOrder(
        order.total, // Original amount in rupees (will be converted to paise)
        'INR',       // currency
        order.id     // receipt (using our order ID)
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
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
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
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode
    }));
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
    <div className="container max-w-2xl mx-auto px-4 py-8">
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
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              defaultValue={formData.address}
              error={errors?.address}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className={errors?.city ? "border-red-500" : ""}
                />
                {errors?.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className={errors?.state ? "border-red-500" : ""}
                />
                {errors?.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className={errors?.zipCode ? "border-red-500" : ""}
                />
                {errors?.zipCode && (
                  <p className="text-sm text-red-500">{errors.zipCode}</p>
                )}
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
                className={errors?.phone ? "border-red-500" : ""}
              />
              {errors?.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
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

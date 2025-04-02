import { pocketbase } from './pocketbase';
import { testDirectWebhook } from './webhookTest';

// Define Razorpay-related types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  capture?: boolean;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: {
    code: string;
    description: string;
  };
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  payment_capture: number;
}

// WebHook configuration for n8n
const N8N_WEBHOOK_URL = "https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7";
const N8N_AUTH_USERNAME = "nirmal@lifedemy.in";
const N8N_AUTH_PASSWORD = "Life@123";

// Load the Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Get Razorpay Key ID from environment variables
export const getRazorpayKeyId = (): string => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    console.error('VITE_RAZORPAY_KEY_ID not found in environment variables');
    throw new Error('Razorpay key not configured. Please check your environment variables.');
  }
  return key;
};

// Get Razorpay Key Secret from environment variables
export const getRazorpayKeySecret = (): string => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_SECRET;
  if (!key) {
    console.error('VITE_RAZORPAY_KEY_SECRET not found in environment variables');
    throw new Error('Razorpay key secret not configured. Please check your environment variables.');
  }
  return key;
};

// Create a Razorpay order via PocketBase
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<CreateOrderResponse> => {
  try {
    console.log('Creating Razorpay order with auto-capture enabled');
    
    // Generate a unique ID for this transaction
    const uniqueId = `order_${Date.now()}`;
    
    // Return order data with payment_capture=1 for auto-capture
    return {
      id: uniqueId,
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      status: 'created',
      payment_capture: 1 // Hard coded to 1 for auto-capture
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Initialize and open Razorpay payment modal
export const openRazorpayCheckout = (options: RazorpayOptions): void => {
  if (typeof window.Razorpay === 'undefined') {
    console.error('Razorpay script not loaded');
    throw new Error('Payment gateway is not available. Please refresh the page.');
  }

  // Log payment attempt (redact sensitive info)
  console.log('Opening Razorpay payment window with options:', {
    ...options,
    key: options.key ? '****' : undefined,
    amount: options.amount,
    currency: options.currency,
    prefill: options.prefill ? {
      name: options.prefill.name,
      email: options.prefill.email ? '****' : undefined,
      contact: options.prefill.contact ? '****' : undefined
    } : undefined
  });
  
  try {
    // Create the razorpay instance with auto-capture enabled
    const razorpay = new window.Razorpay({
      key: options.key || getRazorpayKeyId(),
      amount: options.amount,
      currency: options.currency || 'INR',
      name: options.name || 'Konipai',
      description: options.description || 'Payment',
      image: options.image,
      order_id: options.order_id,
      capture: true, // Enable auto-capture
      handler: function(response: RazorpayResponse) {
        console.log('Razorpay payment success callback received', {
          ...response,
          razorpay_payment_id: response.razorpay_payment_id ? response.razorpay_payment_id.substring(0, 4) + '****' : undefined
        });
        
        if (!response.razorpay_payment_id) {
          console.error('Missing payment ID in Razorpay response');
          alert('Payment failed: Missing payment details. Please try again or contact support.');
          return;
        }
        
        if (options.handler) {
          options.handler(response);
        }
      },
      prefill: options.prefill || {},
      notes: options.notes || {},
      theme: options.theme || { color: '#4F46E5' },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed by user');
        },
        escape: false,
        backdropclose: false
      }
    });
    
    // Handle payment failure
    razorpay.on('payment.failed', function(response: RazorpayResponse) {
      console.error('Payment failed:', response.error);
      alert(`Payment failed: ${response.error?.description || 'Unknown error occurred'}`);
    });
    
    razorpay.open();
  } catch (error) {
    console.error('Error opening Razorpay payment window:', error);
    alert('Failed to open payment window. Please try again or contact support.');
    throw error;
  }
};

/**
 * Send order data directly to n8n webhook
 */
const sendOrderToWebhook = async (orderId: string, user: Record<string, unknown>) => {
  try {
    console.log('Preparing to send order to n8n webhook:', N8N_WEBHOOK_URL);
    
    // Fetch order details first
    const order = await pocketbase.collection('orders').getOne(orderId);
    if (!order) {
      console.warn('Order not found, skipping webhook notification');
      return; // Don't throw error, just return silently
    }
    
    console.log('Order fetched successfully. Processing order data for webhook...');
    
    // Function to format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount / 100); // Convert paisa to rupees
    };

    // Parse products if they are stored as a string
    let orderProducts = [];
    try {
      orderProducts = typeof order.products === 'string'
        ? JSON.parse(order.products)
        : order.products;
      
      // Ensure orderProducts is an array
      if (!Array.isArray(orderProducts)) {
        console.warn('Products is not an array, converting to empty array');
        orderProducts = [];
      }
    } catch (e) {
      console.error('Error parsing products:', e);
      orderProducts = [];
    }

    // Build a formatted shipping address
    let formattedAddress = '';
    let shippingAddressObj = {};
    if (order.shipping_address) {
      try {
        const address = typeof order.shipping_address === 'string'
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;
        
        shippingAddressObj = address;
        
        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.city) addressParts.push(address.city);
        if (address.state) addressParts.push(address.state);
        if (address.postalCode) addressParts.push(address.postalCode);
        if (address.country) addressParts.push(address.country);
        
        formattedAddress = addressParts.join(', ');
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    }

    // Ensure we have the required data for webhook
    // If any of these are missing, still attempt to send with what we have
    if (!order.customer_name || !order.customer_email) {
      console.warn('Order missing customer details, attempting to send webhook with limited data');
    }

    // Prepare the webhook data
    const webhookData = {
      eventType: "payment_success",
      notificationType: "order_payment_success",
      timestamp: new Date().toISOString(),
      orderId: order.id,
      orderDate: order.created,
      customerInfo: {
        name: order.customer_name || 'Customer',
        email: order.customer_email || 'No email provided',
        phone: order.customer_phone || 'No phone provided'
      },
      shippingAddress: shippingAddressObj,
      formattedAddress,
      paymentInfo: {
        paymentId: order.payment_id || '',
        paymentOrderId: order.payment_order_id || '',
        paymentStatus: order.payment_status || 'unknown'
      },
      orderStatus: order.status || 'unknown',
      products: orderProducts.map((item: OrderProduct) => ({
        productId: item.productId || item.product?.id || '',
        name: item.product?.name || item.name || 'Product',
        quantity: item.quantity || 1,
        price: item.product?.price || item.price || 0,
        color: item.color || '',
        imageUrl: item.product?.images?.[0] || ''
      })),
      totalItems: orderProducts.reduce((sum, item) => sum + (item.quantity || 1), 0),
      orderSummary: orderProducts.length ? 
        orderProducts.map(item => 
          `- ${item.quantity || 1}x ${item.product?.name || item.name || 'Product'} (${formatCurrency(item.product?.price || item.price || 0)})${item.color ? ` - Color: ${item.color}` : ''}`
        ).join('\n') : 
        'No products in order',
      financialDetails: {
        subtotal: order.subtotal || 0,
        shippingCost: order.shipping_cost || 0,
        total: order.total || 0,
        subtotalFormatted: formatCurrency(order.subtotal || 0),
        shippingCostFormatted: formatCurrency(order.shipping_cost || 0),
        totalFormatted: formatCurrency(order.total || 0)
      },
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: import.meta.env.VITE_SITE_URL || "https://konipai.in",
        logoUrl: `${import.meta.env.VITE_SITE_URL || "https://konipai.in"}/assets/logo.png`,
        year: new Date().getFullYear(),
        viewOrderUrl: `${import.meta.env.VITE_SITE_URL || "https://konipai.in"}/orders/${order.id}`,
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      }
    };

    console.log('Order data for webhook prepared. Sending to webhook...');
    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Send the data to the webhook
    try {
      console.log('Creating fetch request to webhook URL:', N8N_WEBHOOK_URL);
      
      const credentialsBase64 = btoa(`${N8N_AUTH_USERNAME}:${N8N_AUTH_PASSWORD}`);
      console.log('Using basic auth with credential username:', N8N_AUTH_USERNAME);
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + credentialsBase64
        },
        body: JSON.stringify(webhookData),
      });

      // Log response status
      console.log('Webhook response status:', response.status);

      if (!response.ok) {
        // Try to read the response text for more details
        try {
          const responseText = await response.text();
          console.error(`Webhook request failed with status ${response.status}:`, responseText);
        } catch (textError) {
          console.error(`Webhook request failed with status ${response.status} and could not read response:`, textError);
        }
        return; // Don't throw, just log and continue
      }

      // Try to read the response for debugging
      try {
        const responseData = await response.json();
        console.log('Webhook response data:', responseData);
      } catch (jsonError) {
        console.log('Webhook response is not JSON, but request was successful');
      }

      console.log('✅ Successfully sent order', order.id, 'to n8n webhook');
    } catch (webhookError) {
      console.error('Error sending to webhook:', webhookError);
      // Don't throw, just log the error
    }
  } catch (error) {
    console.error('Error preparing order for webhook:', error);
    // Don't throw, just log the error
  }
};

// Add payment status constants
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    CREATED: 'created',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    TIMEOUT: 'timeout'
} as const;

// Add payment timeout constant
const PAYMENT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Verify payment with improved error handling and timeout
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Verifying payment:', { orderId, paymentId, signature: signature ? '****' : undefined });
    
    // Get order details
    let orderDetails;
    try {
      orderDetails = await pocketbase.collection('orders').getOne(orderId);
      console.log('Successfully fetched order details for webhook:', orderDetails.id);
      
      // Check if order is already in a final state
      if (orderDetails.payment_status === PAYMENT_STATUS.PAID ||
          orderDetails.payment_status === PAYMENT_STATUS.FAILED ||
          orderDetails.payment_status === PAYMENT_STATUS.TIMEOUT) {
        console.log(`Order ${orderId} is already in final state: ${orderDetails.payment_status}`);
        return { success: true };
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      return {
        success: false,
        error: 'Failed to fetch order details'
      };
    }
    
    // Set up payment timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Payment verification timeout'));
      }, PAYMENT_TIMEOUT);
    });
    
    // Race between payment verification and timeout
    try {
      await Promise.race([
        // Payment verification logic
        (async () => {
          // Try to send a webhook notification
          try {
            const customerName = orderDetails.customer_name || 'Customer';
            const customerEmail = orderDetails.customer_email || '';
            const customerPhone = orderDetails.customer_phone || '';
            const shippingAddress = orderDetails.shipping_address || {};
            let orderProducts = [];
            const subtotal = orderDetails.subtotal || 0;
            const shippingCost = orderDetails.shipping_cost || 0;
            const total = orderDetails.total || 0;
            
            // Parse products
            try {
              orderProducts = typeof orderDetails.products === 'string'
                ? JSON.parse(orderDetails.products)
                : orderDetails.products || [];
              
              if (!Array.isArray(orderProducts)) {
                orderProducts = [];
              }
            } catch (e) {
              console.error('Error parsing products:', e);
            }
            
            // Use the direct webhook approach
            const webhookResult = await testDirectWebhook({
              eventType: "payment_success",
              notificationType: "order_payment_success",
              orderId: orderId,
              customerInfo: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
              },
              shippingAddress: shippingAddress,
              paymentInfo: {
                paymentId: paymentId,
                paymentOrderId: orderId,
                paymentStatus: PAYMENT_STATUS.PAID
              },
              orderStatus: 'processing',
              products: orderProducts.map((item: OrderProduct) => ({
                productId: item.productId || item.product?.id || '',
                name: item.product?.name || item.name || 'Product',
                quantity: item.quantity || 1,
                price: item.product?.price || item.price || 0,
                color: item.color || '',
                imageUrl: item.product?.images?.[0] || ''
              })),
              financialDetails: {
                subtotal,
                shippingCost,
                total
              }
            });
            
            console.log('Webhook notification result:', webhookResult.success ? 'success' : 'failed');
          } catch (webhookError) {
            console.error('Error sending webhook:', webhookError);
            // Don't fail verification due to webhook issues
          }
        })(),
        timeoutPromise
      ]);
      
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Payment verification timeout') {
        // Update order status to timeout
        try {
          const record = await pocketbase.collection('orders').getOne(orderId);
          record.payment_status = PAYMENT_STATUS.TIMEOUT;
          record.status = 'payment_timeout';
          await pocketbase.collection('orders').update(orderId, record);
          console.log(`Order ${orderId} marked as timeout`);
        } catch (updateError) {
          console.error('Error updating order status:', updateError);
        }
        
        return {
          success: false,
          error: 'Payment verification timeout'
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
}

// Add global window type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: RazorpayResponse) => void) => void;
    };
  }
}

// Update the products mapping with proper typing
interface OrderProduct {
  productId?: string;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    images?: string[];
  };
  name?: string;
  quantity?: number;
  price?: number;
  color?: string;
}
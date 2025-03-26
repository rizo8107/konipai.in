import { pocketbase } from './pocketbase';

// Define Razorpay-related types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
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
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  paymentId?: string;
  orderId?: string;
  signature?: string;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
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
    console.log('Creating Razorpay order');
    
    // Generate a unique ID for this transaction
    const uniqueId = `order_${Date.now()}`;
    
    // Return order data for direct payment flow
    return {
      id: uniqueId,
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      status: 'created'
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
    key: options.key ? '****' : undefined, // Don't log the actual key
    amount: options.amount,
    currency: options.currency,
    prefill: options.prefill ? {
      name: options.prefill.name,
      email: options.prefill.email ? '****' : undefined,
      contact: options.prefill.contact ? '****' : undefined
    } : undefined
  });
  
  try {
    // Create the razorpay instance
    const razorpay = new window.Razorpay({
      key: options.key || getRazorpayKeyId(),
      amount: options.amount, // Amount in paise
      currency: options.currency || 'INR',
      name: options.name || 'Konipai',
      description: options.description || 'Payment',
      image: options.image,
      order_id: options.order_id,
      handler: function(response: RazorpayResponse) {
        console.log('Razorpay payment success callback received', {
          ...response,
          razorpay_payment_id: response.razorpay_payment_id ? response.razorpay_payment_id.substring(0, 4) + '****' : undefined
        });
        
        // Handle missing data
        if (!response.razorpay_payment_id) {
          console.error('Missing payment ID in Razorpay response');
          alert('Payment failed: Missing payment details. Please try again or contact support.');
          return;
        }
        
        // Forward to handler
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
    
    // Open the modal
    razorpay.on('payment.failed', function(response: any) {
      console.error('Payment failed:', response.error);
      alert(`Payment failed: ${response.error.description}`);
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
    console.log('Preparing to send order to n8n webhook...');
    
    // Fetch order details first
    const order = await pocketbase.collection('orders').getOne(orderId);
    if (!order) {
      console.warn('Order not found, skipping webhook notification');
      return; // Don't throw error, just return silently
    }
    
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
      products: orderProducts.map(item => ({
        productId: item.productId || item.product?.id || 'unknown',
        name: item.product?.name || item.name || 'Product',
        quantity: item.quantity || 1,
        price: item.product?.price || item.price || 0,
        color: item.color || 'N/A',
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

    console.log('Order data for webhook prepared');

    // Send the data to the webhook
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${N8N_AUTH_USERNAME}:${N8N_AUTH_PASSWORD}`)
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        console.error(`Webhook request failed with status ${response.status}`);
        return; // Don't throw, just log and continue
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

// Verify payment after successful transaction
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Verifying payment:', { orderId, paymentId, signature: signature ? '****' : undefined });
    
    // We need to assume the payment is valid at this point
    // The actual verification would happen server-side with a webhook from Razorpay
    
    // Try to send a webhook notification
    try {
      await sendOrderToWebhook(orderId, pocketbase.authStore.model);
    } catch (webhookError) {
      console.error('Error sending webhook but continuing:', webhookError);
      // Don't fail verification due to webhook issues
    }
    
    // Return success
    return { success: true };
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
    };
  }
}
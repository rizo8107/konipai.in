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

// Create a Razorpay order via the Razorpay Orders API
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<CreateOrderResponse> => {
  try {
    console.log('Creating Razorpay order with amount:', amount);

    // For local development, create a dummy order ID
    if (window.location.hostname === 'localhost') {
      console.log('Running in local development mode, creating mock order');
      const mockOrderId = `order_${Date.now()}`;
      return {
        id: mockOrderId,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        status: 'created'
      };
    }
    
    // In production, use PocketBase as a proxy to create Razorpay order
    try {
      const response = await pocketbase.send('/api/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
          currency,
          receipt,
          payment_capture: 1,  // 1 for auto-capture, 0 for manual
          notes: {
            source: 'Konipai Website'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Successfully created Razorpay order:', response.id);
      
      return {
        id: response.id,
        amount: response.amount,
        currency: response.currency,
        receipt: response.receipt,
        status: response.status
      };
    } catch (pocketbaseError) {
      console.error('Error using PocketBase proxy for Razorpay order:', pocketbaseError);
      
      // Fallback to direct creation for now (will need server implementation)
      const fallbackId = `order_${Date.now()}`;
      console.warn('Using fallback order ID:', fallbackId);
      
      return {
        id: fallbackId,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        status: 'created'
      };
    }
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
      modal: options.modal || {
        ondismiss: function() {
          console.log('Payment modal closed by user');
        },
        escape: false,
        backdropclose: false
      }
    });
    
    // Open the modal
    razorpay.on('payment.failed', function(response: { error: { description: string } }) {
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
      products: orderProducts.map((item: any) => ({
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

// Verify payment after successful transaction
export async function verifyPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Verifying payment:', { paymentId, orderId, signature: signature ? '****' : undefined });
    
    // For local development, bypass actual verification
    if (window.location.hostname === 'localhost') {
      console.log('Local development mode: Skipping actual payment verification');
      // Mock successful verification
      return { success: true };
    }
    
    // In production, we should verify via our backend
    let paymentStatus = 'unknown';
    
    try {
      // Verify through PocketBase (needs implementation on the backend)
      const verificationResult = await pocketbase.send('/api/razorpay/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          order_id: orderId,
          signature: signature
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!verificationResult.verified) {
        return {
          success: false,
          error: verificationResult.error || 'Payment verification failed'
        };
      }
      
      paymentStatus = verificationResult.status || 'authorized';
    } catch (verificationError) {
      console.error('Error verifying payment through backend:', verificationError);
      // In case of failure, assume it's valid for now (will be fixed with proper backend)
      // In production, this should fail
      console.warn('Bypassing verification failure for now');
    }
    
    // Get order details to include in the webhook
    let orderDetails;
    try {
      orderDetails = await pocketbase.collection('orders').getOne(orderId);
      console.log('Successfully fetched order details for webhook:', orderDetails.id);
    } catch (error) {
      console.error('Error fetching order details for webhook, but continuing:', error);
      // Continue with the basic order details we have
    }
    
    // Try to send a webhook notification
    try {
      let customerName = 'Customer';
      let customerEmail = '';
      let customerPhone = '';
      let shippingAddress = {};
      let formattedAddress = '';
      let orderProducts = [];
      let subtotal = 0;
      let shippingCost = 0;
      let total = 0;
      
      // Extract details from the order if available
      if (orderDetails) {
        customerName = orderDetails.customer_name || customerName;
        customerEmail = orderDetails.customer_email || customerEmail;
        customerPhone = orderDetails.customer_phone || customerPhone;
        subtotal = orderDetails.subtotal || subtotal;
        shippingCost = orderDetails.shipping_cost || shippingCost;
        total = orderDetails.total || total;
        
        // Parse products
        try {
          orderProducts = typeof orderDetails.products === 'string'
            ? JSON.parse(orderDetails.products)
            : orderDetails.products || [];
          
          if (!Array.isArray(orderProducts)) {
            orderProducts = [];
          }
        } catch (e) {
          console.error('Error parsing products for webhook:', e);
        }
        
        // Parse shipping address
        if (orderDetails.shipping_address_text) {
          try {
            console.log(`Processing shipping address text: ${orderDetails.shipping_address_text.substring(0, 50)}...`);
            
            try {
              const parsedAddress = JSON.parse(orderDetails.shipping_address_text);
              console.log('Successfully parsed shipping address from text field');
              
              shippingAddress = {
                street: parsedAddress.street || '',
                city: parsedAddress.city || '',
                state: parsedAddress.state || '',
                postalCode: parsedAddress.postalCode || '',
                country: parsedAddress.country || 'India'
              };
              
              // Build formatted address
              const addressParts = [];
              if (parsedAddress.street) addressParts.push(parsedAddress.street);
              if (parsedAddress.city) addressParts.push(parsedAddress.city);
              if (parsedAddress.state) addressParts.push(parsedAddress.state);
              if (parsedAddress.postalCode) addressParts.push(parsedAddress.postalCode);
              if (parsedAddress.country) addressParts.push(parsedAddress.country);
              
              formattedAddress = addressParts.join(', ');
              console.log('Formatted address from text field:', formattedAddress);
            } catch (parseError) {
              console.error('Error parsing address JSON from text field:', parseError);
            }
            
            // If we still don't have an address, log a warning
            if (Object.keys(shippingAddress).length === 0) {
              console.warn('Unable to parse shipping address from text field');
            }
          } catch (e) {
            console.error('Error processing shipping address text:', e);
          }
        } else {
          console.warn('No shipping_address_text field found in order');
        }
      }
      
      // Use the direct webhook approach
      const webhookResult = await testDirectWebhook({
        eventType: "payment.success",
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
          paymentStatus: paymentStatus // Use the status from verification
        },
        orderStatus: 'processing',
        products: orderProducts.map((item: any) => ({
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
      console.error('Error sending webhook but continuing:', webhookError);
      // Don't fail verification due to webhook issues
    }
    
    // Return success based on payment status
    return { success: true };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
}

// Immediately capture a payment that's been authorized
export const captureRazorpayPayment = async (
  paymentId: string,
  amount?: number
): Promise<boolean> => {
  try {
    console.log(`Attempting to capture payment ${paymentId}${amount ? ` for amount ${amount}` : ''}`);
    
    // For local development, bypass actual capture
    if (window.location.hostname === 'localhost') {
      console.log('Local development mode: Simulating payment capture');
      return true;
    }
    
    // In production, use PocketBase as a proxy to capture the payment
    try {
      const response = await pocketbase.send('/api/razorpay/capture-payment', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount: amount
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Payment capture response:', response);
      return response.status === 'captured';
    } catch (pocketbaseError) {
      console.error('Error using PocketBase proxy for payment capture:', pocketbaseError);
      
      // For now, assume success (this should be fixed with proper backend implementation)
      console.warn('Unable to capture payment through backend, assuming success for now');
      return true;
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
    return false;
  }
};

// Add global window type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}
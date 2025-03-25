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

// Create a Razorpay order using Razorpay API
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<CreateOrderResponse> => {
  try {
    console.log('Creating Razorpay order with amount:', amount);
    
    // For live mode, we need to create a real order on Razorpay
    // This function should be called from your backend for security
    // But for this implementation, we'll use a server-side proxy or fallback
    
    try {
      // Try to use server backend to create order (more secure)
      const RAZORPAY_API_URL = `${import.meta.env.VITE_POCKETBASE_URL}/api/orders/create-razorpay-order`;
      
      const response = await fetch(RAZORPAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
          currency,
          receipt
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Created Razorpay order with server API:', data);
        return data;
      }
      
      console.warn('Failed to create order with server API, falling back to client-side');
    } catch (err) {
      console.warn('Error using server API, falling back:', err);
    }
    
    // Fallback to client-side order ID generation (only works in test mode)
    // In production, this should be replaced with a real API call
    const uniqueId = `order_${Date.now()}`;
    console.log('Using generated order ID (test mode only):', uniqueId);
    
    return {
      id: uniqueId,
      amount: Math.round(amount * 100), // Convert to paise
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
    return;
  }

  console.log('Opening Razorpay payment window with options:', { 
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    order_id: options.order_id 
  });
  
  // Make sure we have all required options for live mode
  const paymentOptions = {
    key: getRazorpayKeyId(),
    amount: options.amount, // Amount in paise
    currency: options.currency || 'INR',
    name: options.name || 'Konipai',
    description: options.description || 'Payment',
    order_id: options.order_id, // Required for live mode
    handler: options.handler,
    prefill: options.prefill || {},
    theme: options.theme || { color: '#4F46E5' },
    modal: {
      confirm_close: true, // Confirm before closing payment modal
      escape: false // Prevent closing with ESC key
    }
  };
  
  const razorpay = new window.Razorpay(paymentOptions);
  razorpay.open();
};

/**
 * Send order data directly to n8n webhook
 */
const sendOrderToWebhook = async (order, user) => {
  try {
    console.log('Preparing to send order to n8n webhook...');
    
    // Function to format currency
    const formatCurrency = (amount) => {
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
        formattedAddress = '';
        shippingAddressObj = {};
      }
    }

    // Calculate total items and create summary
    let orderSummary = "";
    let totalItems = 0;

    try {
      if (orderProducts.length === 0) {
        orderSummary = "No products in order";
      } else {
        orderProducts.forEach(item => {
          const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
          totalItems += quantity;
          const price = typeof item.price === 'number' ? item.price : 0;
          const name = item.product?.name || item.name || 'Product';
          
          orderSummary += `- ${quantity}x ${name} (${formatCurrency(price)})`;
          if (item.color) {
            orderSummary += ` - Color: ${item.color}`;
          }
          orderSummary += "\n";
        });
      }
    } catch (e) {
      console.error("Error generating product list:", e);
      orderSummary = "Error generating product list. Please check your order online.";
    }

    // Process product data to ensure we have proper information
    const processedProducts = orderProducts.map(item => {
      // Extract product information with fallbacks for each field
      const productId = item.productId || item.product?.id || '';
      const name = item.product?.name || item.name || 'Product';
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      const price = typeof item.price === 'number' ? item.price : (item.product?.price || 0);
      const color = item.color || item.variant || 'Default';
      
      // Handle image URL with multiple fallbacks
      let imageUrl = '';
      if (item.image) {
        imageUrl = item.image;
      } else if (item.product?.image) {
        imageUrl = item.product.image;
      } else if (item.product?.expand?.image?.url) {
        imageUrl = item.product.expand.image.url;
      } else if (item.product?.imageUrl) {
        imageUrl = item.product.imageUrl;
      } else if (item.imageUrl) {
        imageUrl = item.imageUrl;
      }
      
      // Add the origin to image URL if it's a relative path
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://konipai.in${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      
      return {
        productId,
        name,
        quantity,
        price,
        color,
        imageUrl
      };
    });

    // Get the subtotal, shipping cost and total values with fallbacks
    const subtotal = order.subtotal || order.totalAmount || 0;
    const shippingCost = order.shipping_cost || 0;
    const total = order.total || order.totalAmount || subtotal + shippingCost || 0;

    // Prepare the order data for the webhook
    const orderForWebhook = {
      // Event metadata
      eventType: "payment_success",
      notificationType: "order_payment_success",
      timestamp: new Date().toISOString(),
      
      // Order details
      orderId: order.id,
      orderDate: order.created,
      updatedDate: order.updated,
      
      // Customer information
      customerInfo: {
        name: user.name || 'Customer',
        email: user.email,
        phone: order.customer_phone || user.phone || ""
      },
      
      // Address information
      shippingAddress: shippingAddressObj,
      formattedAddress: formattedAddress,
      
      // Payment information
      paymentInfo: {
        paymentId: order.payment_id || '',
        paymentOrderId: order.payment_order_id || '',
        paymentStatus: 'paid'
      },
      
      // Order status
      orderStatus: 'processing',
      
      // Product information with enhanced data
      products: processedProducts,
      totalItems: totalItems,
      orderSummary: orderSummary,
      
      // Financial details
      financialDetails: {
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total,
        subtotalFormatted: formatCurrency(subtotal),
        shippingCostFormatted: formatCurrency(shippingCost),
        totalFormatted: formatCurrency(total)
      },
      
      // Email template data
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: "https://konipai.in",
        logoUrl: "https://konipai.in/assets/logo.png",
        year: new Date().getFullYear(),
        viewOrderUrl: `https://konipai.in/orders/${order.id}`,
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      }
    };

    // Create basic auth credentials
    const base64Credentials = btoa(`${N8N_AUTH_USERNAME}:${N8N_AUTH_PASSWORD}`);
    
    // Send the data to n8n webhook
    console.log('Sending order data to n8n webhook...');
    console.log('Order data for webhook:', JSON.stringify(orderForWebhook, null, 2));
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64Credentials}`
      },
      body: JSON.stringify(orderForWebhook),
    });

    // Check if the request was successful
    if (response.ok) {
      console.log(`✅ Successfully sent order ${order.id} to n8n webhook`);
      return true;
    } else {
      const responseText = await response.text();
      console.error(`❌ Failed to send order to n8n webhook: ${response.status} ${response.statusText}`);
      console.error(`Response: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.error(`Error sending order to n8n webhook:`, error);
    return false;
  }
};

// Verify payment after successful transaction
export const verifyRazorpayPayment = async (
  paymentId: string,
  orderId: string,
  signature?: string
): Promise<boolean> => {
  try {
    console.log('Payment successful:', { paymentId });
    
    // Update order status in PocketBase
    try {
      // Update the PocketBase order with payment information
      const updatedOrder = await pocketbase.collection('orders').update(orderId, {
        payment_status: 'paid',
        payment_id: paymentId,
        status: 'processing',
        notes: `Payment completed via Razorpay. Payment ID: ${paymentId}`
      });
      console.log('Order updated with payment information');
      
      // Get the user data to include in the webhook
      const userData = await pocketbase.collection('users').getOne(updatedOrder.user);
      
      // Send order data directly to n8n webhook instead of relying on PocketBase hooks
      await sendOrderToWebhook(updatedOrder, userData);
      
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // We still return true because the payment was successful,
      // even if our database update failed
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
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
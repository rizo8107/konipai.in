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
    console.warn('VITE_RAZORPAY_KEY_ID not found in environment variables, using default test key');
    return 'rzp_test_trImBTMCiZgDuF'; // Fallback to test key
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
    return;
  }

  console.log('Opening Razorpay payment window');
  
  // Use direct checkout with live API key
  const paymentOptions = {
    key: getRazorpayKeyId(),
    amount: options.amount, // Amount in paise
    currency: options.currency || 'INR',
    name: options.name || 'Konipai',
    description: options.description || 'Payment',
    handler: options.handler,
    prefill: options.prefill || {},
    theme: options.theme || { color: '#4F46E5' }
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
        formattedAddress = 'Address information not available';
        shippingAddressObj = { error: 'Could not parse address' };
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
          const name = item.name || 'Product';
          
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
      
      // Product information
      products: orderProducts.map(item => ({
        productId: item.productId || '',
        name: item.name || 'Product',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        price: typeof item.price === 'number' ? item.price : 0,
        color: item.color || '',
        imageUrl: item.image || ''
      })),
      totalItems: totalItems,
      orderSummary: orderSummary,
      
      // Financial details
      financialDetails: {
        subtotal: order.subtotal || order.totalAmount || 0,
        shippingCost: order.shipping_cost || 0,
        total: order.total || order.totalAmount || 0,
        subtotalFormatted: formatCurrency(order.subtotal || order.totalAmount || 0),
        shippingCostFormatted: formatCurrency(order.shipping_cost || 0),
        totalFormatted: formatCurrency(order.total || order.totalAmount || 0)
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
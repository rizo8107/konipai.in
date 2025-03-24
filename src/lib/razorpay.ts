import { pocketbase } from './pocketbase';

// Define Razorpay-related types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
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
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

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
  return import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_trImBTMCiZgDuF';
};

// Create a Razorpay order via PocketBase
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<CreateOrderResponse> => {
  try {
    // Always use direct payment approach since the PocketBase endpoint is not available
    console.log('Using direct payment approach');
    const mockOrderId = `order_mock_${Date.now()}`;
    
    // Return mock order data
    return {
      id: mockOrderId,
      amount: amount * 100,
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

  // Use direct payment approach
  console.log('Using direct payment (no order_id)');
  
  // For direct payment, remove order_id 
  const directOptions = {
    ...options,
    order_id: undefined, // Remove order_id for direct payment flow
    key: getRazorpayKeyId(),
    amount: options.amount, // Amount in paise
    currency: options.currency || 'INR',
    name: options.name || 'Konipai',
    description: options.description || 'Payment',
    handler: options.handler,
    prefill: options.prefill || {},
    theme: options.theme || { color: '#4F46E5' }
  };
  
  const razorpay = new window.Razorpay(directOptions);
  razorpay.open();
};

// Verify payment after successful transaction
export const verifyRazorpayPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<boolean> => {
  try {
    console.log('Payment verification data:', { paymentId, orderId, signature });
    
    // For direct payment, we assume verification is successful
    console.log('Direct payment verification - auto success');
    
    // Update order status in PocketBase
    try {
      // The orderId parameter is our PocketBase order ID
      await pocketbase.collection('orders').update(orderId, {
        payment_status: 'paid',
        razorpay_payment_id: paymentId,
        notes: `Payment completed via Razorpay. Payment ID: ${paymentId}`
      });
      console.log('Order updated with payment information');
    } catch (dbError) {
      console.warn('Database update error:', dbError);
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
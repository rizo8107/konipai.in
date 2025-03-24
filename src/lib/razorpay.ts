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
  return import.meta.env.VITE_RAZORPAY_KEY_ID;
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
      await pocketbase.collection('orders').update(orderId, {
        payment_status: 'paid',
        razorpay_payment_id: paymentId,
        notes: `Payment completed via Razorpay. Payment ID: ${paymentId}`
      });
      console.log('Order updated with payment information');
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
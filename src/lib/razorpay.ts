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
    // For development/testing in browser environment (CORS prevents direct API calls)
    const isTestMode = !import.meta.env.PROD || import.meta.env.VITE_RAZORPAY_TEST_MODE === 'true';
    
    if (isTestMode && !pocketbase.authStore.isValid) {
      console.log('Using test mode payment flow (no auth)');
      const mockOrderId = `order_mock_${Date.now()}`;
      
      // Return mock order data
      return {
        id: mockOrderId,
        amount: amount * 100,
        currency,
        receipt,
        status: 'created'
      };
    }
    
    // Use the PocketBase custom API endpoint for creating orders
    try {
      // Make sure we're working with the amount in paise (100 paise = 1 INR)
      const amountInPaise = Math.round(amount * 100);
      
      // Call the PocketBase API endpoint
      const response = await pocketbase.send('/api/razorpay/create-order', {
        method: 'POST',
        body: {
          amount: amountInPaise,
          currency: currency,
          receipt: receipt
        }
      });
      
      console.log('Razorpay order created:', response);
      return response as CreateOrderResponse;
    } catch (apiError: unknown) {
      console.error('Error calling Razorpay API:', apiError);
      
      // If we're in test mode, fall back to mock order
      if (isTestMode) {
        console.log('Falling back to test mode payment flow after API error');
        const mockOrderId = `order_mock_${Date.now()}`;
        
        // Return mock order data
        return {
          id: mockOrderId,
          amount: amount * 100,
          currency,
          receipt,
          status: 'created'
        };
      }
      
      throw apiError;
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
    return;
  }

  // Fix for test mode - if using mock order ID, use a direct payment approach
  if (options.order_id.startsWith('order_mock_')) {
    console.log('Using test mode direct payment (no order_id)');
    
    // For test mode, remove order_id to use direct payment flow
    const testOptions = {
      ...options,
      order_id: undefined, // Remove order_id for direct payment flow
      key: getRazorpayKeyId(),
      amount: options.amount, // Amount in paise
      currency: options.currency || 'INR',
      name: options.name || 'Konipai',
      description: options.description || 'Test Payment',
      handler: options.handler,
      prefill: options.prefill || {},
      theme: options.theme || { color: '#4F46E5' }
    };
    
    const razorpay = new window.Razorpay(testOptions);
    razorpay.open();
    return;
  }

  // Normal flow for production with valid order ID
  const razorpay = new window.Razorpay(options);
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
    
    // For mock implementation, assume verification is successful
    if (orderId.startsWith('order_mock_')) {
      console.log('Mock payment verification - auto success');
      
      // Still update the DB records
      try {
        const records = await pocketbase.collection('razorpay_orders').getList(1, 1, {
          filter: `order_id = "${orderId}"`
        });
        
        if (records.items.length > 0) {
          const record = records.items[0];
          await pocketbase.collection('razorpay_orders').update(record.id, {
            payment_id: paymentId,
            payment_status: 'paid',
            updated: new Date().toISOString()
          });
          
          // Update the related order if we can find it
          if (record.receipt) {
            try {
              await pocketbase.collection('orders').update(record.receipt, {
                payment_status: 'paid',
                razorpay_payment_id: paymentId,
                razorpay_order_id: orderId,
                notes: `Test payment completed via Razorpay. Payment ID: ${paymentId}, Order ID: ${orderId}`
              });
            } catch (orderError) {
              console.error('Error updating order:', orderError);
            }
          }
        }
      } catch (dbError) {
        console.warn('Database update error:', dbError);
      }
      
      return true;
    }
    
    // Use the PocketBase API endpoint for payment verification
    try {
      const response = await pocketbase.send('/api/razorpay/verify-payment', {
        method: 'POST',
        body: {
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature
        }
      });
      
      console.log('Payment verification response:', response);
      return response.verified === true;
    } catch (apiError) {
      console.error('Error verifying payment with API:', apiError);
      // In test mode or if API fails, assume payment is valid
      return import.meta.env.VITE_RAZORPAY_TEST_MODE === 'true';
    }
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
import { loadScript } from './utils';

// Define Razorpay types
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
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

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

// Get the server URL from environment or use default
// Use a relative URL instead of trying to construct an absolute one
const SERVER_URL = '/api/razorpay';

// New CRM Supabase endpoint for order creation
const CRM_ORDER_ENDPOINT = import.meta.env.VITE_CRM_ORDER_ENDPOINT || 'https://crm-supabase.7za6uc.easypanel.host/functions/v1/create-order';

// Get Razorpay Key ID from environment
export function getRazorpayKeyId(): string {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
}

// Get Razorpay Key Secret from environment (for server-side operations)
export function getRazorpayKeySecret(): string {
  return import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';
}

/**
 * Create a Razorpay order
 * @param amount Amount in INR (will be converted to paise)
 * @param currency Currency code (default: INR)
 * @param receipt Receipt ID (optional)
 * @param notes Additional notes (optional)
 * @returns Promise with the created order
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt?: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  try {
    console.log(`Creating order with CRM endpoint: ${CRM_ORDER_ENDPOINT}`);
    
    // Convert amount to paise if it's not already (Razorpay expects amount in smallest currency unit)
    // Ensure we're sending the correct amount for small values like ₹1
    const amountInPaise = Math.max(Math.round(amount * 100), 100); // Minimum 100 paise (₹1)
    console.log(`Amount: ₹${amount} converted to ${amountInPaise} paise`);
    
    // Log the exact payload we're sending to the CRM endpoint
    const payload = {
      amount: amountInPaise,
      currency,
      receipt,
      notes,
      amount_in_paise: true, // Explicitly indicate amount is in paise
      original_amount_inr: amount // Send original amount for debug
    };
    console.log('Sending payload to CRM endpoint:', payload);
    
    // Use fetch with the CRM Supabase endpoint
    const response = await fetch(CRM_ORDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Failed to create order: ${response.status}`);
      } catch (e) {
        throw new Error(`Failed to create order: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    }

    const orderData = await response.json();
    console.log('Order created successfully:', orderData);
    return orderData;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Load the Razorpay checkout script
 * @returns Promise that resolves when the script is loaded
 */
export async function loadRazorpayScript(): Promise<boolean> {
  return loadScript('https://checkout.razorpay.com/v1/checkout.js', 'razorpay-checkout');
}

/**
 * Open the Razorpay checkout modal
 * @param options Razorpay options
 * @returns Promise that resolves when payment is complete
 */
export function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpaySuccessResponse> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure key is set
      if (!options.key) {
        options.key = getRazorpayKeyId();
      }
      
      console.log('Opening Razorpay checkout with options:', {
        ...options,
        key: options.key.substring(0, 8) + '...' // Log partial key for security
      });
      
      const razorpay = new (window as any).Razorpay({
        ...options,
        handler: function (response: RazorpaySuccessResponse) {
          console.log('Payment successful, response:', response);
          resolve(response);
        },
      });

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        reject(new Error(response.error.description || 'Payment failed'));
      });

      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      reject(error);
    }
  });
}

/**
 * Verify a Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param orderId Razorpay order ID
 * @param signature Razorpay signature
 * @returns Promise with the verification result
 */
export async function verifyRazorpayPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<RazorpayPaymentResponse> {
  try {
    const response = await fetch(`${SERVER_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
}

/**
 * Capture a Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param amount Amount to capture (optional)
 * @returns Promise with the capture result
 */
export async function captureRazorpayPayment(
  paymentId: string,
  amount?: number
): Promise<RazorpayPaymentResponse> {
  try {
    const response = await fetch(`${SERVER_URL}/capture-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_id: paymentId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment capture failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error capturing Razorpay payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment capture failed',
    };
  }
}

/**
 * Refund a Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param amount Amount to refund (optional, full refund if not specified)
 * @returns Promise with the refund result
 */
export async function refundRazorpayPayment(
  paymentId: string,
  amount?: number
): Promise<any> {
  try {
    const response = await fetch(`${SERVER_URL}/refund-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_id: paymentId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment refund failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refunding Razorpay payment:', error);
    throw error;
  }
}

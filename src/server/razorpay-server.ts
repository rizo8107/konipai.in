import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Initialize Razorpay instance with credentials from environment variables
 */
const getRazorpayInstance = (): Razorpay => {
  const keyId = process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.VITE_RAZORPAY_KEY_SECRET || '';
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys not found in environment variables');
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

/**
 * Interface for Razorpay order creation options
 */
export interface CreateOrderOptions {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  payment_capture?: 0 | 1;
}

/**
 * Creates a new order in Razorpay
 * 
 * @param options Order creation options
 * @returns Promise with the created order details
 */
export const createOrder = async (options: CreateOrderOptions) => {
  try {
    const razorpay = getRazorpayInstance();
    
    // Ensure amount is in paise (multiply by 100 if in rupees)
    const amount = Math.round(options.amount);
    
    const orderOptions = {
      amount,
      currency: options.currency || 'INR',
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: {
        source: 'Konipai Website',
        ...options.notes
      },
      payment_capture: options.payment_capture === 0 ? 0 : 1
    };
    
    console.log('Creating Razorpay order with options:', orderOptions);
    
    const order = await razorpay.orders.create(orderOptions);
    console.log('Successfully created Razorpay order:', order.id);
    
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verifies a Razorpay payment signature
 * 
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 * @returns Boolean indicating if the signature is valid
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const razorpay = getRazorpayInstance();
    const secret = process.env.VITE_RAZORPAY_KEY_SECRET || '';
    
    // Create the data string that was used to generate the signature
    const data = orderId + "|" + paymentId;
    
    // Use crypto module to verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    
    // Compare the signatures
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Captures an authorized payment
 * 
 * @param paymentId Razorpay payment ID
 * @param amount Amount to capture (in paise)
 * @returns Promise with the captured payment details
 */
export const capturePayment = async (paymentId: string, amount?: number) => {
  try {
    const razorpay = getRazorpayInstance();
    
    // For Razorpay API, we need to pass the amount as a number
    // If no amount is provided, we'll pass 0 to capture the full amount
    const amountToCapture = amount ? Math.round(amount) : 0;
    
    // The capture method requires paymentId, amount, and currency
    const payment = await razorpay.payments.capture(
      paymentId, 
      amountToCapture, 
      'INR'
    );
    
    console.log('Successfully captured payment:', payment && payment.id);
    
    return payment;
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw error;
  }
};

/**
 * Fetches payment details from Razorpay
 * 
 * @param paymentId Razorpay payment ID
 * @returns Promise with the payment details
 */
export const getPaymentDetails = async (paymentId: string) => {
  try {
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Refunds a payment
 * 
 * @param paymentId Razorpay payment ID
 * @param amount Amount to refund (in paise)
 * @returns Promise with the refund details
 */
export const refundPayment = async (paymentId: string, amount?: number) => {
  try {
    const razorpay = getRazorpayInstance();
    
    const refundOptions: { amount?: number } = {};
    if (amount) {
      refundOptions.amount = Math.round(amount);
    }
    
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    console.log('Successfully refunded payment:', refund.id);
    
    return refund;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};

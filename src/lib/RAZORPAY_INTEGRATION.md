# Razorpay Integration Guide

This document explains the Razorpay integration in the Konipai e-commerce platform, which uses a hybrid approach with both server-side and client-side implementations.

## Overview

The integration consists of:

1. **Server-side implementation** using the official Razorpay Node.js SDK
2. **Client-side implementation** that communicates with the server
3. **Fallback mechanism** to use direct API calls when the server is unavailable

This hybrid approach provides:
- Secure server-side operations using the official SDK
- Flexibility with client-side fallback
- Smooth transition path for the migration to Strapi

## Server-Side Implementation

The server-side implementation is in `src/server/razorpay-server.ts` and uses the official Razorpay Node.js SDK.

### Key Features

- **Order Creation**: Create Razorpay orders securely
- **Payment Verification**: Verify payment signatures
- **Payment Capture**: Explicitly capture authorized payments
- **Payment Details**: Fetch payment information
- **Refunds**: Process refunds when needed

### API Endpoints

The server exposes the following endpoints in `src/server/razorpay-routes.ts`:

- `POST /api/razorpay/create-order`: Create a new Razorpay order
- `POST /api/razorpay/verify-payment`: Verify a payment signature
- `POST /api/razorpay/capture-payment`: Capture an authorized payment
- `POST /api/razorpay/refund-payment`: Refund a payment

## Client-Side Implementation

The client-side implementation in `src/lib/razorpay-client.ts` provides a wrapper around the server-side API.

### Key Features

- **Automatic Fallback**: Falls back to direct API calls if the server is unavailable
- **Development Mode**: Provides mock implementations for local development
- **Consistent Interface**: Maintains the same interface as the existing implementation

## Usage Examples

### Creating an Order

```typescript
import { createRazorpayOrder } from '@/lib/razorpay-client';

// Amount in rupees (will be converted to paise)
const amount = 500;
const currency = 'INR';
const receipt = `receipt_${Date.now()}`;

try {
  const order = await createRazorpayOrder(amount, currency, receipt);
  console.log('Order created:', order.id);
} catch (error) {
  console.error('Error creating order:', error);
}
```

### Opening the Checkout

```typescript
import { openRazorpayCheckout } from '@/lib/razorpay-client';

const options = {
  key: 'your_razorpay_key_id', // Optional, will use environment variable if not provided
  amount: 50000, // Amount in paise
  currency: 'INR',
  name: 'Konipai',
  description: 'Purchase of tote bags',
  order_id: 'order_id_from_create_order',
  handler: function(response) {
    console.log('Payment successful:', response);
    // Verify the payment
    verifyPayment(response);
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3399cc'
  }
};

try {
  await openRazorpayCheckout(options);
} catch (error) {
  console.error('Error opening checkout:', error);
}
```

### Verifying a Payment

```typescript
import { verifyRazorpayPayment } from '@/lib/razorpay-client';

async function verifyPayment(response) {
  try {
    const result = await verifyRazorpayPayment(
      response.razorpay_payment_id,
      response.razorpay_order_id,
      response.razorpay_signature
    );
    
    if (result.success) {
      console.log('Payment verified successfully');
      // Update order status
    } else {
      console.error('Payment verification failed:', result.error);
      // Handle verification failure
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
  }
}
```

### Capturing a Payment

```typescript
import { captureRazorpayPayment } from '@/lib/razorpay-client';

async function capturePayment(paymentId, amount) {
  try {
    const success = await captureRazorpayPayment(paymentId, amount);
    
    if (success) {
      console.log('Payment captured successfully');
      // Update order status to 'captured'
    } else {
      console.error('Payment capture failed');
      // Handle capture failure
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
  }
}
```

## Environment Variables

The integration uses the following environment variables:

```
# Razorpay API Keys
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_RAZORPAY_KEY_SECRET=your_key_secret

# Server URL (for client-side implementation)
VITE_SERVER_URL=http://localhost:3000

# Use server in development mode
VITE_USE_SERVER_IN_DEV=true

# Fallback proxy URL
VITE_RAZORPAY_PROXY_URL=https://your-proxy-url/razorpay
VITE_RAZORPAY_PROXY_KEY=your_proxy_key
```

## Strapi Migration Considerations

When migrating to Strapi, the Razorpay integration can be adapted as follows:

1. The server-side implementation can be moved to Strapi as a custom endpoint
2. The client-side implementation will remain largely unchanged, just update the server URL
3. Update environment variable handling to use Strapi's configuration

### Example Strapi Integration

```javascript
// In Strapi API route handler
module.exports = {
  async createOrder(ctx) {
    const { amount, currency, receipt, notes } = ctx.request.body;
    
    try {
      const order = await strapi.services.razorpay.createOrder({
        amount,
        currency,
        receipt,
        notes
      });
      
      ctx.send(order);
    } catch (error) {
      ctx.badRequest('Order creation failed', { error: error.message });
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **Payment verification fails**: Check that the correct API keys are being used
2. **Server connection issues**: The client will automatically fall back to direct API calls
3. **CORS errors**: Ensure the server's CORS configuration includes your frontend domain

### Debugging

Enable detailed logging by setting the following in your browser console:

```javascript
localStorage.setItem('debug_razorpay', 'true');
```

This will output detailed logs for all Razorpay operations.

# Switching Razorpay to Live Mode

This document outlines the steps required to switch the Razorpay integration from test mode to live mode.

## Prerequisites

1. You must have a verified Razorpay account with live mode activated
2. You need your Razorpay live API keys:
   - Live Key ID (`rzp_live_*****`)
   - Live Secret Key (`******`)

## Configuration Steps

### 1. Update Environment Variables

Update the `.env` file with your live Razorpay keys:

```
# Razorpay Configuration (LIVE)
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET_HERE
```

Replace `YOUR_LIVE_KEY_HERE` with your actual Razorpay live key ID and secret.

### 2. Update Environment Variables on Hosting Platform

Make sure to update the environment variables on your hosting platform as well.

### 3. Test Live Mode

Once deployed with live keys, make a small test purchase to ensure everything is working correctly:

1. Use a real card or UPI to make a small purchase (Razorpay recommends INR 1)
2. Verify that the payment gets correctly recorded in your Razorpay dashboard
3. Verify that the order status gets updated correctly in your database

### 4. Important Differences Between Test and Live Mode

- In live mode, you can only use real payment methods (no test cards)
- Real money will be transferred for each transaction
- Razorpay fees will apply to each transaction
- You need to handle refunds carefully as they involve real money

### 5. Rollback Plan

If you encounter issues with live mode:

1. Temporarily revert to test keys in your environment variables
2. Deploy the application with test keys
3. Contact Razorpay support for any payment-related issues

## Monitoring Live Payments

Once in live mode, regularly check your Razorpay dashboard to:

1. Monitor successful payments
2. Handle any failed payments or disputes
3. Process refunds when needed

## Security Considerations

- Never commit your Razorpay live keys to your codebase
- Ensure your secrets are properly protected in environment variables
- Make sure webhook endpoints are secured with proper authentication
- Implement proper error handling for payment failures
- Store payment IDs and other transaction details securely

If you have any issues or questions, please contact the development team. 
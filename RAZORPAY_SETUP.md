# Razorpay Integration Setup

This document explains how to set up and configure the Razorpay payment gateway integration with your Konipai e-commerce site running on PocketBase.

## Prerequisites

1. A Razorpay account (you can sign up at [Razorpay.com](https://razorpay.com))
2. PocketBase backend running and accessible
3. Konipai frontend application

## Environment Configuration

Add your Razorpay credentials to the environment variables:

```bash
# In your .env file
VITE_RAZORPAY_KEY_ID=rzp_test_trImBTMCiZgDuF  # Using test mode key
RAZORPAY_KEY_SECRET=rmnubcj2HK7z9SvnsEDklkoS  # Test mode secret
```

For the frontend, you only need to expose the `VITE_RAZORPAY_KEY_ID`. The secret key should be kept on the server side (in PocketBase).

## Backend Setup

1. Make sure you have placed the `pb_hooks/razorpay.pb.js` file in your PocketBase directory.
2. Add the Razorpay key and secret to your PocketBase environment:

   ```bash
   # If running PocketBase manually
   RAZORPAY_KEY_ID=rzp_test_trImBTMCiZgDuF RAZORPAY_KEY_SECRET=rmnubcj2HK7z9SvnsEDklkoS ./pocketbase serve
   
   # If using Docker
   docker run -p 8090:8090 -e RAZORPAY_KEY_ID=rzp_test_trImBTMCiZgDuF -e RAZORPAY_KEY_SECRET=rmnubcj2HK7z9SvnsEDklkoS -v ./pb_data:/pb_data pocketbase
   ```

3. Run the PocketBase schema initialization to add the required fields:

   ```bash
   npm run init:pocketbase
   ```

## Testing the Integration

1. Start your frontend and backend applications
2. Create an account and add products to your cart
3. Proceed to checkout
4. Fill in the shipping details and click "Pay Now"
5. You should see the Razorpay modal open

### Test Mode Cards

Since we're using Razorpay's test mode, you can use these test cards:

| Card Network | Card Number         | CVV | Expiry Date | OTP  |
|--------------|---------------------|-----|-------------|------|
| Visa         | 4111 1111 1111 1111 | Any | Any future  | 1234 |
| Mastercard   | 5267 3181 8797 5449 | Any | Any future  | 1234 |
| RuPay        | 6121 9100 0000 0061 | Any | Any future  | 1234 |

For simulating different outcomes:
- For successful payment: Use above cards and complete the process
- For failed payment: Use card number 4000 0000 0000 0002

## Webhook Configuration (Production)

When moving to production, you should set up webhooks in your Razorpay dashboard:

1. Go to Dashboard > Settings > Webhooks
2. Add a new webhook with the URL: `https://your-pocketbase-url.com/api/razorpay/webhook`
3. Select the events you want to listen for (at minimum: payment.authorized, payment.failed)
4. Save the webhook

## Troubleshooting

- **Payment Modal Doesn't Open**: Check the browser console for errors and ensure the Razorpay script is loading correctly.
- **Payment Fails**: Verify your Razorpay credentials are correct in the environment variables.
- **Order Not Updated After Payment**: Check the PocketBase logs for any errors in the webhook or payment verification.

## Switching to Production

When ready to switch to production:

1. Update your environment variables to use your live Razorpay keys
2. Update the `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in all configurations
3. Make sure webhooks are properly configured for your production environment

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Test Mode Documentation](https://razorpay.com/docs/payments/payments/test-mode/)
- [PocketBase Hooks Documentation](https://pocketbase.io/docs/js-overview/) 
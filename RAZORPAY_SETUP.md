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
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

For the frontend, you only need to expose the `VITE_RAZORPAY_KEY_ID`. The secret key should be kept on the server side (in PocketBase).

## Backend Setup

1. Make sure you have placed the `pb_hooks/razorpay.pb.js` file in your PocketBase directory.
2. Add the Razorpay key and secret to your PocketBase environment:

   ```bash
   # If running PocketBase manually
   RAZORPAY_KEY_ID=your_key_id RAZORPAY_KEY_SECRET=your_key_secret ./pocketbase serve
   
   # If using Docker
   docker run -p 8090:8090 -e RAZORPAY_KEY_ID=your_key_id -e RAZORPAY_KEY_SECRET=your_key_secret -v ./pb_data:/pb_data pocketbase
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
6. In test mode, you can use the following test card:
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3-digit number
   - Name: Any name

## Webhook Configuration (Production)

For production use, you should set up webhooks in your Razorpay dashboard:

1. Go to Dashboard > Settings > Webhooks
2. Add a new webhook with the URL: `https://your-pocketbase-url.com/api/razorpay/webhook`
3. Select the events you want to listen for (at minimum: payment.authorized, payment.failed)
4. Save the webhook

## Troubleshooting

- **Payment Modal Doesn't Open**: Check the browser console for errors and ensure the Razorpay script is loading correctly.
- **Payment Fails**: Verify your Razorpay credentials are correct in the environment variables.
- **Order Not Updated After Payment**: Check the PocketBase logs for any errors in the webhook or payment verification.

## Production Considerations

- Always use HTTPS for all communications
- Set up proper error handling and logging
- Implement order status checking for recovery from interrupted payments
- Consider handling currency conversion if needed

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [PocketBase Hooks Documentation](https://pocketbase.io/docs/js-overview/) 
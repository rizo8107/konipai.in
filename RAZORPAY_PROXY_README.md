# Razorpay Proxy Integration

This document explains how the frontend application is configured to work with the Razorpay proxy server.

## Environment Configuration

The frontend application has been updated to use the Razorpay proxy server instead of making direct API calls. The following environment variables need to be set:

```
VITE_RAZORPAY_PROXY_URL=http://localhost:3000   # URL of your Razorpay proxy server
VITE_RAZORPAY_PROXY_KEY=your_api_key            # API key for authentication with the proxy
```

## How It Works

The frontend code in `src/lib/razorpay.ts` makes API calls to the proxy server for these operations:

1. **Creating Orders**: `createRazorpayOrder()` sends a request to `${proxyUrl}/create-order`
2. **Verifying Payments**: `verifyPayment()` sends a request to `${proxyUrl}/verify-payment`
3. **Capturing Payments**: `captureRazorpayPayment()` sends a request to `${proxyUrl}/capture-payment`

Each request includes the API key in the `X-API-Key` header for authentication.

## Testing the Integration

A test HTML file is provided to validate the proxy server integration:

1. Make sure your Razorpay proxy server is running (e.g., on http://localhost:3000)
2. Open `razorpay-proxy-test.html` in a browser
3. Update the `proxyUrl` and `apiKey` variables in the script if needed
4. Click the test buttons to check each endpoint

## Production Deployment

When deploying to production:

1. Deploy your Razorpay proxy server to a secure host with HTTPS
2. Update the .env file with the production URL and a secure API key
3. Make sure your CORS settings in the proxy server allow requests from your frontend domain

## Troubleshooting

If you encounter issues with the proxy integration:

1. Check the browser console for error messages
2. Verify that the proxy server is running and accessible
3. Confirm that the API key is correctly set in both the frontend and proxy server
4. Check that the proxy server is properly handling requests and forwarding them to Razorpay

For development purposes, the code includes fallbacks:

- Local development mode will use mock data for testing
- If the proxy server is not available, it will try to use the n8n webhook (deprecated)

## Security Notes

- Always use HTTPS in production to protect API keys and payment data
- Never expose your Razorpay secret key in the frontend code
- The proxy server should validate all incoming requests before forwarding to Razorpay
- Keep your API keys secure and rotate them periodically 
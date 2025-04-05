# Razorpay Proxy Server Setup Guide

This guide explains how to set up a dedicated server to proxy Razorpay API requests, ensuring payment capture works correctly and keeping your API keys secure.

## Step 1: Create a New Project

```bash
mkdir razorpay-proxy
cd razorpay-proxy
npm init -y
```

## Step 2: Install Dependencies

```bash
npm install express cors dotenv crypto body-parser axios
npm install --save-dev nodemon
```

## Step 3: Create Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
RAZORPAY_KEY_ID=rzp_live_3rZx2njbNwMEE1
RAZORPAY_KEY_SECRET=XF5TUBWcXzu4K2h3T3jVGCVC
API_KEY=your_secure_api_key_for_proxy_auth
ALLOWED_ORIGINS=http://localhost:5173,https://konipai.in
```

## Step 4: Create Server File

Create a file named `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Razorpay API Base URL
const RAZORPAY_API = 'https://api.razorpay.com/v1';

// Create Razorpay order
app.post('/create-order', authenticateApiKey, async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Ensure payment_capture is set to 1
    const requestBody = {
      amount,
      currency,
      receipt,
      payment_capture: 1, // Force payment_capture to 1
      notes
    };
    
    console.log('Creating order with:', requestBody);
    
    const response = await axios.post(`${RAZORPAY_API}/orders`, requestBody, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log('Order created successfully:', response.data.id);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Verify payment
app.post('/verify-payment', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id, order_id, signature } = req.body;
    
    // Verify signature
    const text = order_id + '|' + payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      console.log('Signature verification failed');
      return res.json({
        verified: false,
        error: 'Invalid signature'
      });
    }
    
    // Get payment status from Razorpay
    const payment = await axios.get(`${RAZORPAY_API}/payments/${payment_id}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log('Payment verified, status:', payment.data.status);
    
    res.json({
      verified: true,
      status: payment.data.status,
      payment: payment.data
    });
  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      verified: false,
      error: error.response?.data || error.message
    });
  }
});

// Capture payment
app.post('/capture-payment', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({ error: 'payment_id is required' });
    }
    
    const requestBody = {};
    if (amount) {
      requestBody.amount = amount;
    }
    
    console.log(`Capturing payment ${payment_id}${amount ? ` for amount ${amount}` : ''}`);
    
    const response = await axios.post(
      `${RAZORPAY_API}/payments/${payment_id}/capture`, 
      requestBody,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        }
      }
    );
    
    console.log('Payment captured successfully:', response.data.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error capturing payment:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Razorpay proxy server running on port ${PORT}`);
});
```

## Step 5: Update package.json Scripts

Update the scripts section in package.json:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## Step 6: Deployment Options

### Option 1: Deploy to Render.com (Simple)

1. Create a free account at render.com
2. Click "New Web Service"
3. Connect your GitHub repo
4. Configure:
   - Name: razorpay-proxy
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add your .env variables

### Option 2: Deploy to Railway (Simple)

1. Create account at railway.app
2. Create new project
3. Deploy from GitHub
4. Add environment variables from .env file

### Option 3: Deploy to Your Own Server

1. Install Node.js on your server
2. Copy the project files
3. Run: 
   ```bash
   npm install
   npm start
   ```
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```

## Step 7: Update Your Frontend Code

Update your frontend environment variables:

```
VITE_RAZORPAY_PROXY_URL=https://your-proxy-url.com
VITE_RAZORPAY_PROXY_KEY=your_secure_api_key_for_proxy_auth
```

## Security Considerations

1. Always use HTTPS for your proxy server
2. Store API keys securely and never expose them in client-side code
3. Implement rate limiting to prevent abuse
4. Log all requests for debugging and auditing
5. Set up proper CORS to only allow requests from your domains

## Testing Your Proxy

Use curl or Postman to test your endpoints:

```bash
# Test create order
curl -X POST https://your-proxy-url.com/create-order \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secure_api_key_for_proxy_auth" \
  -d '{"amount": 50000, "currency": "INR", "receipt": "receipt_123"}'

# Test payment verification
curl -X POST https://your-proxy-url.com/verify-payment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secure_api_key_for_proxy_auth" \
  -d '{"payment_id": "pay_123", "order_id": "order_123", "signature": "generated_signature"}'

# Test payment capture
curl -X POST https://your-proxy-url.com/capture-payment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secure_api_key_for_proxy_auth" \
  -d '{"payment_id": "pay_123", "amount": 50000}'
```

## Why This Solution Works

1. **Enforces `payment_capture: 1`**: This proxy server always sets `payment_capture: 1` in the order creation request, ensuring payments are automatically captured.

2. **Keeps API keys secure**: Your Razorpay API keys stay on the server and are never exposed to clients.

3. **Avoids CORS issues**: Since all API calls go through your server, you avoid the CORS issues that happen with direct browser-to-Razorpay calls.

4. **Provides consistent error handling**: The proxy server standardizes error responses and logging.

5. **Allows customization**: You can add additional logic as needed, such as logging, notification triggers, or database updates. 
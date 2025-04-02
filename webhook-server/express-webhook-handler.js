require('dotenv').config({ path: '../.env' });
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL;
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

let adminAuthToken = null;

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

async function getAdminAuthToken() {
  if (adminAuthToken) return adminAuthToken;
  
  try {
    const response = await axios.post(`${POCKETBASE_URL}api/admins/auth-with-password`, {
      identity: POCKETBASE_ADMIN_EMAIL,
      password: POCKETBASE_ADMIN_PASSWORD
    });
    
    adminAuthToken = response.data.token;
    return adminAuthToken;
  } catch (error) {
    console.error('Failed to get admin auth token:', error.message);
    throw error;
  }
}

function isValidSignature(body, signature) {
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return expected === signature;
}

app.post('/api/razorpay/webhook', async (req, res) => {
  console.log('Received webhook:', {
    event: req.body.event,
    headers: req.headers
  });

  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    console.error('No signature found in request');
    return res.status(400).send('Missing signature');
  }

  if (!isValidSignature(req.rawBody, signature)) {
    console.error('Invalid signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payment = req.body.payload.payment.entity;
  const razorpayOrderId = payment.order_id;
  const notes = payment.notes || {};
  const orderId = notes.order_id;

  console.log('Processing payment:', {
    event,
    razorpayOrderId,
    orderId,
    status: payment.status
  });

  try {
    const adminToken = await getAdminAuthToken();
    
    // First try to find the order by razorpay_order_id
    let records = await axios.get(`${POCKETBASE_URL}api/collections/orders/records?filter=(razorpay_order_id="${razorpayOrderId}")`, {
      headers: { Authorization: adminToken }
    });

    // If not found, try to find by order_id from notes
    if (!records.data.items.length && orderId) {
      records = await axios.get(`${POCKETBASE_URL}api/collections/orders/records?filter=(id="${orderId}")`, {
        headers: { Authorization: adminToken }
      });
    }

    const record = records.data.items[0];
    if (!record) {
      console.error('Order not found:', { razorpayOrderId, orderId });
      return res.status(404).send('Order not found');
    }

    let status;
    switch (event) {
      case 'payment.captured':
        status = 'PAID';
        break;
      case 'payment.failed':
        status = 'FAILED';
        break;
      case 'payment.authorized':
        status = 'AUTHORIZED';
        break;
      case 'payment.refunded':
        status = 'REFUNDED';
        break;
      default:
        status = payment.status.toUpperCase();
    }

    console.log('Updating order status:', {
      orderId: record.id,
      status,
      event
    });

    await axios.patch(
      `${POCKETBASE_URL}api/collections/orders/records/${record.id}`,
      { status, payment_status: status },
      { headers: { Authorization: adminToken } }
    );

    console.log('Successfully updated order status');
    res.send({ status: 'success', message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('Error processing webhook:', err.message, err.response?.data);
    res.status(500).send({
      status: 'error',
      message: 'Internal Server Error',
      error: err.message
    });
  }
});

app.get('/health', (req, res) => {
  res.send({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Webhook server listening at http://localhost:${PORT}`);
  console.log('Environment:', {
    POCKETBASE_URL,
    PORT,
    hasWebhookSecret: !!RAZORPAY_WEBHOOK_SECRET
  });
}); 
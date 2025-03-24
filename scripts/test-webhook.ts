import fetch from 'node-fetch';

/**
 * Test script to send a payload to the n8n webhook
 */
async function testWebhook() {
  const WEBHOOK_URL = 'https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7';
  
  // Authentication credentials
  const username = 'nirmal@lifedemy.in';
  const password = 'Life@123';
  
  // Create basic auth header
  const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const authHeader = `Basic ${base64Credentials}`;
  
  try {
    console.log('Sending test webhook payload with authentication...');
    
    // Create a test payload
    const testPayload = {
      eventType: 'test',
      notificationType: 'order_test',
      timestamp: new Date().toISOString(),
      orderId: 'TEST-' + Math.floor(Math.random() * 10000),
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+91 9876543210'
      },
      orderStatus: 'processing',
      products: [
        {
          productId: 'test-product-1',
          name: 'Test Product',
          quantity: 1,
          price: 99900,
          color: 'Blue',
          imageUrl: 'https://konipai.in/assets/products/sample.jpg'
        }
      ],
      totalItems: 1,
      orderSummary: '- 1x Test Product (₹999.00) - Color: Blue\n',
      financialDetails: {
        subtotal: 99900,
        shippingCost: 0,
        total: 99900,
        subtotalFormatted: '₹999.00',
        shippingCostFormatted: '₹0.00',
        totalFormatted: '₹999.00'
      },
      testMode: true,
      source: 'manual webhook test'
    };
    
    // Send the request
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(testPayload)
    });
    
    // Log the response
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    try {
      const text = await response.text();
      console.log('Response body:', text);
    } catch (e) {
      console.log('No response body or error reading it');
    }
    
    if (response.ok) {
      console.log('✅ Webhook test successful');
    } else {
      console.error('❌ Webhook test failed');
    }
    
  } catch (error) {
    console.error('Error sending test webhook:', error);
  }
}

// Run the test
testWebhook()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test script error:', err)); 
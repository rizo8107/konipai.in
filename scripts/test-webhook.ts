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
    
    const orderId = 'TEST-' + Math.floor(Math.random() * 10000);
    
    // Create a test payload with all possible email template fields
    const testPayload = {
      // Event metadata
      eventType: 'test',
      notificationType: 'order_test',
      timestamp: new Date().toISOString(),
      
      // Order details
      orderId: orderId,
      orderDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      
      // Customer information
      customerInfo: {
        name: 'Nirmal Test',
        email: 'nirmal@lifedemy.in', // Replace with actual recipient
        phone: '+91 9876543210'
      },
      
      // Address information 
      shippingAddress: {
        street: '123 Test Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India'
      },
      formattedAddress: '123 Test Street, Chennai, Tamil Nadu, 600001, India',
      
      // Payment information
      paymentInfo: {
        paymentId: 'pay_' + Math.random().toString(36).substring(2, 15),
        paymentOrderId: 'order_' + Math.random().toString(36).substring(2, 15),
        paymentStatus: 'paid'
      },
      
      // Order status
      orderStatus: 'processing',
      
      // Product information
      products: [
        {
          productId: 'prod-1',
          name: 'Premium Cotton T-Shirt',
          quantity: 1,
          price: 129900,
          color: 'Navy Blue',
          imageUrl: 'https://konipai.in/assets/products/tshirt.jpg'
        },
        {
          productId: 'prod-2',
          name: 'Designer Tote Bag',
          quantity: 2,
          price: 99900,
          color: 'Beige',
          imageUrl: 'https://konipai.in/assets/products/tote.jpg'
        }
      ],
      totalItems: 3, // Sum of all quantities
      orderSummary: `- 1x Premium Cotton T-Shirt (₹1,299.00) - Color: Navy Blue
- 2x Designer Tote Bag (₹999.00) - Color: Beige`,
      
      // Financial details
      financialDetails: {
        subtotal: 329700, // 129900 + (99900 * 2)
        shippingCost: 0,
        total: 329700,
        subtotalFormatted: '₹3,297.00',
        shippingCostFormatted: '₹0.00',
        totalFormatted: '₹3,297.00'
      },
      
      // Email template data
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: "https://konipai.in",
        logoUrl: "https://konipai.in/assets/logo.png",
        year: new Date().getFullYear(),
        viewOrderUrl: `https://konipai.in/orders/${orderId}`,
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      },
      
      // Test mode indicator
      testMode: true,
      source: 'manual webhook test'
    };
    
    // Send the request
    console.log('Sending webhook payload...');
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
      console.log('A test email should be sent to:', testPayload.customerInfo.email);
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
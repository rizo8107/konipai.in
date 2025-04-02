// Import fetch for Node.js
const fetch = require('node-fetch');

// Configuration
const PROXY_URL = 'https://konipai-server.7za6uc.easypanel.host';
const API_KEY = '5dbe988c-f245-4ba1-b879-af12bab1eb15';

// Create a test order
async function createTestOrder() {
  try {
    console.log('Creating test order...');
    
    const orderData = {
      amount: 50000, // 500 INR in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        source: 'Test Script'
      }
    };
    
    console.log('Request data:', orderData);
    
    const response = await fetch(`${PROXY_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.id) {
      console.log('\n=== Checkout Information ===');
      console.log(`Razorpay Order ID: ${data.id}`);
      console.log(`Amount: ₹${data.amount / 100}`);
      console.log('\nUse this Order ID in the HTML test page to complete the payment.');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating test order:', error);
  }
}

// Run the test
createTestOrder(); 
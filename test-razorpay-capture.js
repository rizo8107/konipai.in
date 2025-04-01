// Test script for Razorpay capture payment endpoint
import fetch from 'node-fetch';

// Update these values with your actual test data
const POCKETBASE_URL = 'https://backend-pocketbase.7za6uc.easypanel.host';
const TEST_PAYMENT_ID = 'pay_test12345'; // Replace with a real test payment ID
const TEST_AMOUNT = 10000; // Amount in paise (100 INR)
const TEST_ORDER_ID = 'order_test12345'; // Replace with a real test order ID

async function testEndpoint(path) {
  try {
    console.log(`🧪 Testing endpoint: ${path}`);
    
    const response = await fetch(`${POCKETBASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://konipai.in'
      },
      body: JSON.stringify({
        payment_id: TEST_PAYMENT_ID,
        amount: TEST_AMOUNT,
        currency: 'INR',
        order_id: TEST_ORDER_ID
      })
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Could not parse JSON response' };
    }
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Endpoint test successful!');
      return true;
    } else {
      console.log('❌ Test failed for this path');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
    return false;
  }
}

async function runTests() {
  // Test both possible paths
  console.log('==================================');
  console.log('TESTING MULTIPLE ENDPOINT PATTERNS');
  console.log('==================================');
  
  const paths = [
    '/api/razorpay/capture-payment',
    '/api/collections/api_endpoints/records'  // Let's check if we can access the endpoints collection
  ];
  
  for (const path of paths) {
    const result = await testEndpoint(path);
    console.log('\n');
  }
}

runTests();

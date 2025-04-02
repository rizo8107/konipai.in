const https = require('https');
const url = require('url');

// Configuration
const proxyUrl = 'https://konipai-server.7za6uc.easypanel.host';
const apiKey = '5dbe988c-f245-4ba1-b879-af12bab1eb15';

// Helper function to make HTTPS requests
function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(proxyUrl + path);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: method,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    };

    console.log(`Making request to: ${parsedUrl.hostname}${parsedUrl.pathname}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test the health endpoint
async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const response = await makeRequest('/health', 'GET');
    console.log(`Status code: ${response.statusCode}`);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error testing health endpoint:', error);
  }
}

// Test creating an order
async function testCreateOrder() {
  console.log('\n=== Testing Create Order Endpoint ===');
  try {
    const orderData = {
      amount: 50000, // 500 INR in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        source: 'Test Script'
      }
    };
    
    console.log('Sending order request:', orderData);
    const response = await makeRequest('/create-order', 'POST', orderData);
    console.log(`Status code: ${response.statusCode}`);
    console.log('Response data:', response.data);
    
    // Return the order ID for verification testing
    return response.data.id;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Starting Razorpay proxy tests...');
  
  // Test health endpoint
  await testHealth();
  
  // Test create order endpoint and get order ID
  const orderId = await testCreateOrder();
  
  // If we successfully created an order, we can print the checkout info
  if (orderId) {
    console.log('\n=== Checkout Information ===');
    console.log(`Razorpay Order ID: ${orderId}`);
    console.log(`Amount: ₹500.00`);
    console.log('\nYou can use this order ID to initiate a payment through the Razorpay checkout.');
    console.log('For testing, you can use the following card:');
    console.log('Card Number: 4111 1111 1111 1111');
    console.log('Expiry: Any future date');
    console.log('CVV: Any 3 digits');
    console.log('Name: Any name');
    console.log('3D Secure Password: 1234');
  }
}

// Run all tests
runTests().catch(console.error); 
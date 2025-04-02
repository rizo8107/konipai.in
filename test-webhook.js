// Test script for Razorpay webhook
import crypto from 'crypto';
import fetch from 'node-fetch';

// Configuration
const WEBHOOK_URL = 'https://backend-pocketbase.7za6uc.easypanel.host/api/razorpay/webhook';
const WEBHOOK_SECRET = 'KERNUV3yj3@m7Tw'; // Your webhook secret from .env

// Sample webhook payloads for different scenarios
const webhookScenarios = [
  {
    name: 'Payment Captured',
    payload: {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_' + Date.now(),
            amount: 50000,
            currency: 'INR',
            status: 'captured',
            order_id: 'order_test_' + Date.now(),
            notes: {
              order_id: 'RECEIPT_ID_HERE' // Replace with an actual order ID from your database
            }
          }
        }
      }
    }
  },
  {
    name: 'Payment Failed',
    payload: {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_failed_' + Date.now(),
            amount: 50000,
            currency: 'INR',
            status: 'failed',
            order_id: 'order_test_failed_' + Date.now(),
            notes: {
              order_id: 'RECEIPT_ID_HERE' // Replace with an actual order ID from your database
            },
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment failed due to insufficient funds'
          }
        }
      }
    }
  },
  {
    name: 'Payment Authorized',
    payload: {
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_auth_' + Date.now(),
            amount: 50000,
            currency: 'INR',
            status: 'authorized',
            order_id: 'order_test_auth_' + Date.now(),
            notes: {
              order_id: 'RECEIPT_ID_HERE' // Replace with an actual order ID from your database
            }
          }
        }
      }
    }
  },
  {
    name: 'Payment Refunded',
    payload: {
      event: 'payment.refunded',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_refund_' + Date.now(),
            amount: 50000,
            currency: 'INR',
            status: 'refunded',
            order_id: 'order_test_refund_' + Date.now(),
            notes: {
              order_id: 'RECEIPT_ID_HERE' // Replace with an actual order ID from your database
            }
          }
        }
      }
    }
  }
];

// Function to generate signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Function to send webhook request
async function sendWebhook(scenario) {
  try {
    const payloadString = JSON.stringify(scenario.payload);
    const signature = generateSignature(payloadString, WEBHOOK_SECRET);
    
    console.log(`\n=== Testing: ${scenario.name} ===`);
    console.log('Sending webhook to:', WEBHOOK_URL);
    console.log('Payload:', payloadString);
    console.log('Signature:', signature);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature,
        'X-Razorpay-Event-Id': `evt_test_${Date.now()}`,
        'User-Agent': 'Razorpay-Webhook/v1.0'
      },
      body: payloadString
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Non-JSON response received', body: responseText };
    }
    
    return {
      success: response.status === 200,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`Error sending webhook for ${scenario.name}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to test invalid signature
async function testInvalidSignature() {
  try {
    const scenario = webhookScenarios[0];
    const payloadString = JSON.stringify(scenario.payload);
    const invalidSignature = 'invalid_signature_' + Date.now();
    
    console.log(`\n=== Testing: Invalid Signature ===`);
    console.log('Sending webhook to:', WEBHOOK_URL);
    console.log('Payload:', payloadString);
    console.log('Invalid Signature:', invalidSignature);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': invalidSignature,
        'X-Razorpay-Event-Id': `evt_test_${Date.now()}`,
        'User-Agent': 'Razorpay-Webhook/v1.0'
      },
      body: payloadString
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Non-JSON response received', body: responseText };
    }
    
    return {
      success: response.status === 400 && responseData.error === 'Invalid signature',
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('Error testing invalid signature:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to test missing signature
async function testMissingSignature() {
  try {
    const scenario = webhookScenarios[0];
    const payloadString = JSON.stringify(scenario.payload);
    
    console.log(`\n=== Testing: Missing Signature ===`);
    console.log('Sending webhook to:', WEBHOOK_URL);
    console.log('Payload:', payloadString);
    console.log('No signature header');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Event-Id': `evt_test_${Date.now()}`,
        'User-Agent': 'Razorpay-Webhook/v1.0'
      },
      body: payloadString
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Non-JSON response received', body: responseText };
    }
    
    return {
      success: response.status === 400 && responseData.error === 'Invalid signature',
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('Error testing missing signature:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Starting Razorpay webhook tests...');
  
  // Test all scenarios
  for (const scenario of webhookScenarios) {
    await sendWebhook(scenario);
  }
  
  // Test invalid signature
  await testInvalidSignature();
  
  // Test missing signature
  await testMissingSignature();
  
  console.log('\nAll tests completed!');
}

// Execute the tests
runTests(); 
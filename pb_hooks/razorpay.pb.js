/// <reference path="../pb_typings.d.ts" />

/**
 * Razorpay integration for PocketBase
 * 
 * This file sets up custom API endpoints to handle Razorpay order creation and payment verification
 */

const crypto = require('crypto');

// Load environment variables or use defaults from our CSV
const RAZORPAY_KEY_ID = $os.getenv('RAZORPAY_KEY_ID') || 'rzp_test_trImBTMCiZgDuF';
const RAZORPAY_KEY_SECRET = $os.getenv('RAZORPAY_KEY_SECRET') || 'rmnubcj2HK7z9SvnsEDklkoS';

// Create a Razorpay order
routerAdd('POST', '/api/razorpay/create-order', (c) => {
    // Authorize the request - user must be authenticated
    const authRecord = $apis.requestInfo(c).authRecord;
    if (!authRecord) {
        return c.json(403, { 'message': 'Unauthorized' });
    }

    // Parse the request body
    let bodyObj;
    try {
        bodyObj = $apis.requestInfo(c).data;
    } catch (e) {
        return c.json(400, { 'message': 'Invalid request data' });
    }

    // Validate required fields
    if (!bodyObj.amount || !bodyObj.currency || !bodyObj.receipt) {
        return c.json(400, { 'message': 'Missing required fields' });
    }

    // Make API request to Razorpay to create an order
    try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const response = $http.send({
            url: 'https://api.razorpay.com/v1/orders',
            method: 'POST',
            body: JSON.stringify({
                amount: bodyObj.amount,
                currency: bodyObj.currency,
                receipt: bodyObj.receipt,
                notes: {
                    user_id: authRecord.id
                }
            }),
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.statusCode >= 400) {
            console.error('Razorpay API error:', response.raw);
            return c.json(response.statusCode, { 'message': 'Failed to create Razorpay order' });
        }

        // Store the order in PocketBase
        // This is useful for tracking payment status later
        const orderData = JSON.parse(response.raw);
        const orderId = orderData.id;

        try {
            $app.dao().db()
                .newQuery('INSERT INTO razorpay_orders (order_id, user_id, amount, currency, receipt, status, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .execute(
                    orderId,
                    authRecord.id,
                    bodyObj.amount,
                    bodyObj.currency,
                    bodyObj.receipt,
                    orderData.status,
                    new Date().toISOString()
                );
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return the order data even if local saving fails
        }

        return c.json(200, orderData);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return c.json(500, { 'message': 'Internal server error' });
    }
});

// Verify a Razorpay payment
routerAdd('POST', '/api/razorpay/verify-payment', (c) => {
    // Authorize the request - user must be authenticated
    const authRecord = $apis.requestInfo(c).authRecord;
    if (!authRecord) {
        return c.json(403, { 'message': 'Unauthorized' });
    }

    // Parse the request body
    let bodyObj;
    try {
        bodyObj = $apis.requestInfo(c).data;
    } catch (e) {
        return c.json(400, { 'message': 'Invalid request data' });
    }

    // Validate required fields
    if (!bodyObj.razorpay_payment_id || !bodyObj.razorpay_order_id || !bodyObj.razorpay_signature) {
        return c.json(400, { 'message': 'Missing required fields' });
    }

    // Verify the signature
    const payload = bodyObj.razorpay_order_id + '|' + bodyObj.razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

    const isSignatureValid = expectedSignature === bodyObj.razorpay_signature;

    // If signature is valid, update the order status
    if (isSignatureValid) {
        try {
            // Update the razorpay_orders table
            $app.dao().db()
                .newQuery('UPDATE razorpay_orders SET payment_id = ?, payment_status = ?, updated = ? WHERE order_id = ?')
                .execute(
                    bodyObj.razorpay_payment_id,
                    'paid',
                    new Date().toISOString(),
                    bodyObj.razorpay_order_id
                );

            // Find the order ID in PocketBase
            const orderQuery = $app.dao().db()
                .newQuery('SELECT receipt FROM razorpay_orders WHERE order_id = ?')
                .execute(bodyObj.razorpay_order_id);

            if (orderQuery && orderQuery.length > 0) {
                const receipt = orderQuery[0].receipt;
                // The receipt is expected to be the order ID in our application
                // Update the order payment status
                try {
                    const record = $app.dao().findRecordById('orders', receipt);
                    if (record) {
                        record.set('payment_status', 'paid');
                        record.set('payment_id', bodyObj.razorpay_payment_id);
                        record.set('payment_order_id', bodyObj.razorpay_order_id);
                        $app.dao().saveRecord(record);
                    }
                } catch (orderError) {
                    console.error('Error updating order:', orderError);
                }
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Continue even if the database update fails
        }
    }

    return c.json(200, { 
        verified: isSignatureValid,
        orderId: bodyObj.razorpay_order_id,
        paymentId: bodyObj.razorpay_payment_id
    });
});

// Capture a payment after authorization
routerAdd('POST', '/api/razorpay/capture-payment', (c) => {
    console.log(" Capture payment endpoint called");
    
    // Add CORS headers to ensure the endpoint works properly
    const origin = c.request().header("Origin") || "";
    const allowedOrigins = [
        "http://localhost:8080",
        "https://konipai.in",
        "https://www.konipai.in"
    ];
    
    // Set appropriate CORS headers based on origin
    if (allowedOrigins.includes(origin)) {
        c.header("Access-Control-Allow-Origin", origin);
    } else {
        c.header("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
    
    c.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Handle OPTIONS preflight request
    if (c.method() === "OPTIONS") {
        return c.json(200, {});
    }

    // Authorize the request - user must be authenticated
    const authRecord = $apis.requestInfo(c).authRecord;
    if (!authRecord) {
        console.error(' Capture payment call failed: User not authenticated');
        return c.json(403, { 'message': 'Unauthorized' });
    }

    // Parse the request body
    let bodyObj;
    try {
        bodyObj = $apis.requestInfo(c).data;
        console.log(' Capture payment request received:', JSON.stringify(bodyObj));
    } catch (e) {
        console.error(' Capture payment call failed: Invalid request data', e);
        return c.json(400, { 'message': 'Invalid request data' });
    }

    // Validate required fields
    if (!bodyObj.payment_id || !bodyObj.amount) {
        console.error(' Capture payment call failed: Missing required fields', bodyObj);
        return c.json(400, { 'message': 'Missing required fields: payment_id and amount are required' });
    }

    // Make API request to Razorpay to capture the payment
    try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        console.log(` Attempting to capture payment ${bodyObj.payment_id} for amount ${bodyObj.amount}`);
        
        const response = $http.send({
            url: `https://api.razorpay.com/v1/payments/${bodyObj.payment_id}/capture`,
            method: 'POST',
            body: JSON.stringify({
                amount: bodyObj.amount,
                currency: bodyObj.currency || 'INR'
            }),
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.statusCode >= 400) {
            console.error(' Razorpay capture API error:', response.statusCode, response.raw);
            return c.json(response.statusCode, { 
                'message': 'Failed to capture payment',
                'details': response.raw,
                'status': 'failed'
            });
        }

        // Parse the response
        const captureData = JSON.parse(response.raw);
        console.log(' Payment captured successfully:', captureData.id, captureData.status);
        
        // Update the payment status in the database if needed
        try {
            // Update the status in razorpay_orders table
            console.log(' Updating payment status in database to captured');
            $app.dao().db()
                .newQuery('UPDATE razorpay_orders SET payment_status = ?, updated = ? WHERE payment_id = ?')
                .execute(
                    'captured',
                    new Date().toISOString(),
                    bodyObj.payment_id
                );
                
            // If order_id is provided, update the orders collection
            if (bodyObj.order_id) {
                try {
                    const record = $app.dao().findRecordById('orders', bodyObj.order_id);
                    if (record) {
                        record.set('payment_status', 'captured');
                        $app.dao().saveRecord(record);
                        console.log(' Order payment status updated to captured:', bodyObj.order_id);
                    } else {
                        console.warn(' Order not found for status update:', bodyObj.order_id);
                    }
                } catch (orderError) {
                    console.error(' Error updating order status after capture:', orderError);
                }
            }
        } catch (dbError) {
            console.error(' Database error during payment capture status update:', dbError);
            // Continue even if db update fails
        }

        return c.json(200, {
            success: true,
            message: 'Payment captured successfully',
            data: captureData
        });
    } catch (error) {
        console.error(' Error capturing Razorpay payment:', error);
        return c.json(500, { 
            'message': 'Internal server error during payment capture',
            'error': String(error)
        });
    }
});

// Create necessary tables for the first run
onBootstrap(() => {
    // Create a table to store Razorpay orders if it doesn't exist
    try {
        const collections = $app.dao().findCollectionsByNameOrId("razorpay_orders");
        if (collections.length === 0) {
            const collection = new Collection({
                name: "razorpay_orders",
                type: "base",
                schema: [
                    {
                        name: "order_id",
                        type: "text",
                        required: true
                    },
                    {
                        name: "amount",
                        type: "number",
                        required: true
                    },
                    {
                        name: "currency",
                        type: "text",
                        required: true
                    },
                    {
                        name: "status",
                        type: "text",
                        required: true
                    }
                ]
            });
            $app.dao().saveCollection(collection);
        }
    } catch (e) {
        console.error("Error creating razorpay_orders collection:", e);
    }
});

// Simple test route to verify hooks are loading
routerAdd('GET', '/api/razorpay-test', (c) => {
    // Add CORS headers to ensure the endpoint works properly
    const origin = c.request().header("Origin") || "";
    const allowedOrigins = [
        "http://localhost:8080",
        "https://konipai.in",
        "https://www.konipai.in"
    ];
    
    // Set appropriate CORS headers based on origin
    if (allowedOrigins.includes(origin)) {
        c.header("Access-Control-Allow-Origin", origin);
    } else {
        c.header("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
    
    return c.json(200, { 
        message: 'Razorpay hooks loaded successfully ',
        timestamp: new Date().toISOString(),
        version: '1.0.1'
    });
});
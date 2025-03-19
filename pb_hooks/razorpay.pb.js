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

// Create necessary tables for the first run
onBootstrap(() => {
    // Create a table to store Razorpay orders if it doesn't exist
    const tableExists = $app.dao().db()
        .newQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='razorpay_orders'")
        .execute();

    if (!tableExists.length) {
        $app.dao().db().newQuery(`
            CREATE TABLE razorpay_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL,
                receipt TEXT NOT NULL,
                status TEXT NOT NULL,
                payment_id TEXT,
                payment_status TEXT DEFAULT 'pending',
                created TEXT NOT NULL,
                updated TEXT
            )
        `).execute();
        
        console.log('Created razorpay_orders table');
    }
}); 
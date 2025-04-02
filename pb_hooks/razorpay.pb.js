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

// Add payment timeout constants
const PAYMENT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const PAYMENT_STATUS = {
    PENDING: 'pending',
    CREATED: 'created',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    TIMEOUT: 'timeout'
};

// Add webhook signature verification function
function verifyWebhookSignature(body, signature, secret) {
    if (!signature || !secret) {
        console.error('Missing signature or secret');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

// Register Razorpay webhook route
routerAdd('POST', '/api/razorpay/webhook', (c) => {
    // Allow public access to webhook
    c.bypassAuth = true;
    
    try {
        // Get request body and signature
        const body = c.request().body;
        const signature = c.request().header('X-Razorpay-Signature');
        const webhookSecret = $os.getenv('RAZORPAY_WEBHOOK_SECRET');

        // Verify webhook signature
        if (!verifyWebhookSignature(body, signature, webhookSecret)) {
            console.error('Invalid webhook signature');
            return c.json(400, { 
                success: false, 
                error: 'Invalid signature' 
            });
        }

        // Parse the body
        const bodyObj = JSON.parse(body);
        console.log('Received Razorpay webhook:', JSON.stringify(bodyObj));
        
        // Extract event details
        const event = bodyObj.event || '';
        
        // Handle payment events
        if (event.startsWith('payment.')) {
            const payload = bodyObj.payload?.payment?.entity || {};
            
            const paymentId = payload.id || '';
            const orderId = payload.notes?.order_id || '';
            let paymentStatus = '';
            
            // Map Razorpay event to status
            switch (event) {
                case 'payment.authorized':
                    paymentStatus = PAYMENT_STATUS.AUTHORIZED;
                    break;
                case 'payment.captured':
                    paymentStatus = PAYMENT_STATUS.CAPTURED;
                    break;
                case 'payment.failed':
                    paymentStatus = PAYMENT_STATUS.FAILED;
                    break;
                case 'payment.refunded':
                    paymentStatus = PAYMENT_STATUS.REFUNDED;
                    break;
                default:
                    paymentStatus = PAYMENT_STATUS.PENDING;
            }
            
            // Process the payment status update
            if (orderId && paymentStatus) {
                try {
                    // Update the razorpay_orders table
                    $app.dao().db()
                        .newQuery('UPDATE razorpay_orders SET payment_id = ?, payment_status = ?, updated = ? WHERE order_id = ?')
                        .execute(
                            paymentId,
                            paymentStatus,
                            new Date().toISOString(),
                            orderId
                        );

                    // Find the order ID in PocketBase
                    const orderQuery = $app.dao().db()
                        .newQuery('SELECT receipt FROM razorpay_orders WHERE order_id = ?')
                        .execute(orderId);

                    if (orderQuery && orderQuery.length > 0) {
                        const receipt = orderQuery[0].receipt;
                        // The receipt is expected to be the order ID in our application
                        // Update the order payment status
                        try {
                            const record = $app.dao().findRecordById('orders', receipt);
                            if (record) {
                                record.set('payment_status', paymentStatus);
                                record.set('payment_id', paymentId);
                                record.set('payment_order_id', orderId);
                                
                                // Update order status based on payment status
                                if (paymentStatus === PAYMENT_STATUS.CAPTURED || paymentStatus === PAYMENT_STATUS.PAID) {
                                    record.set('status', 'processing');
                                } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
                                    record.set('status', 'payment_failed');
                                } else if (paymentStatus === PAYMENT_STATUS.REFUNDED) {
                                    record.set('status', 'cancelled');
                                }
                                
                                $app.dao().saveRecord(record);
                                console.log(`Updated order ${receipt} with payment status ${paymentStatus}`);
                            }
                        } catch (orderError) {
                            console.error('Error updating order:', orderError);
                        }
                    }
                } catch (error) {
                    console.error('Error processing webhook:', error);
                }
            }
        }
        
        // Return success response
        return c.json(200, { success: true });
    } catch (error) {
        console.error('Error processing Razorpay webhook:', error);
        
        // Return error response
        return c.json(400, { 
            success: false, 
            error: error.message 
        });
    }
});

// Create a Razorpay order with timeout handling
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
                payment_capture: 1, // Enable auto-capture
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
        const orderData = JSON.parse(response.raw);
        const orderId = orderData.id;

        try {
            // Insert the order with initial status
            $app.dao().db()
                .newQuery('INSERT INTO razorpay_orders (order_id, user_id, amount, currency, receipt, status, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .execute(
                    orderId,
                    authRecord.id,
                    bodyObj.amount,
                    bodyObj.currency,
                    bodyObj.receipt,
                    PAYMENT_STATUS.PENDING,
                    new Date().toISOString()
                );

            // Set up payment timeout
            setTimeout(async () => {
                try {
                    // Check if order is still pending
                    const order = $app.dao().db()
                        .newQuery('SELECT status FROM razorpay_orders WHERE order_id = ? AND status = ?')
                        .execute(orderId, PAYMENT_STATUS.PENDING);

                    if (order && order.length > 0) {
                        // Update order status to timeout
                        $app.dao().db()
                            .newQuery('UPDATE razorpay_orders SET status = ?, updated = ? WHERE order_id = ?')
                            .execute(
                                PAYMENT_STATUS.TIMEOUT,
                                new Date().toISOString(),
                                orderId
                            );

                        // Update the main order status
                        const record = $app.dao().findRecordById('orders', bodyObj.receipt);
                        if (record) {
                            record.set('payment_status', PAYMENT_STATUS.TIMEOUT);
                            record.set('status', 'payment_timeout');
                            $app.dao().saveRecord(record);
                        }

                        console.log(`Order ${orderId} marked as timeout after ${PAYMENT_TIMEOUT/1000} seconds`);
                    }
                } catch (error) {
                    console.error('Error handling payment timeout:', error);
                }
            }, PAYMENT_TIMEOUT);

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
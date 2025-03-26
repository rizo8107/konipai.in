/// <reference path="../pb_typings.d.ts" />

/**
 * Order Email Integration for PocketBase using Direct SMTP
 * 
 * This file sets up hooks to send order confirmation emails directly via SMTP
 * without relying on external webhook services.
 */

// Import the SMTP module
const smtp = require('../smtp.js');

// Enable debug logging
const DEBUG = true;

// Logging utilities
function debugLog(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

function directLog(message) {
    try {
        console.log('============================');
        console.log(`[EMAIL LOG] ${message}`);
        console.log('============================');
    } catch (e) {
        // Fail silently if logging doesn't work
    }
}

// Track processed orders to avoid duplicates
const processedOrders = new Set();

/**
 * Formats a currency amount as Indian Rupees
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = Number(amount) || 0;
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount / 100); // Convert paisa to rupees
}

/**
 * Parse products from an order
 */
function parseOrderProducts(orderData) {
    try {
        if (!orderData.products) {
            directLog('WARNING: Order has no products array');
            return [];
        }
        
        // Parse from string if needed
        const rawProducts = typeof orderData.products === 'string' 
            ? JSON.parse(orderData.products) 
            : orderData.products;
            
        if (!Array.isArray(rawProducts)) {
            directLog('WARNING: Products is not an array');
            return [];
        }
        
        // Transform to consistent format
        return rawProducts.map(item => {
            // Handle different product data structures
            if (item.product) {
                // New format with nested product object
                return {
                    productId: item.product.id || item.productId || '',
                    product: {
                        id: item.product.id || '',
                        name: item.product.name || 'Product',
                        price: item.product.price || 0,
                        images: item.product.images || []
                    },
                    quantity: item.quantity || 1,
                    color: item.color || ''
                };
            } else {
                // Legacy flat format
                return {
                    productId: item.productId || '',
                    product: {
                        id: item.productId || '',
                        name: item.name || 'Product',
                        price: item.price || 0,
                        images: item.images || []
                    },
                    quantity: item.quantity || 1,
                    color: item.color || ''
                };
            }
        });
    } catch (error) {
        directLog(`Error parsing products: ${error.message}`);
        return [];
    }
}

/**
 * Parse shipping address from an order
 */
function parseShippingAddress(orderData) {
    try {
        if (!orderData.shipping_address) {
            return { formatted: '', data: {} };
        }
        
        const address = typeof orderData.shipping_address === 'string'
            ? JSON.parse(orderData.shipping_address) 
            : orderData.shipping_address;
        
        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.city) addressParts.push(address.city);
        if (address.state) addressParts.push(address.state);
        if (address.postalCode) addressParts.push(address.postalCode);
        if (address.country) addressParts.push(address.country);
        
        return { 
            formatted: addressParts.join(', '),
            data: address
        };
    } catch (error) {
        directLog(`Error parsing shipping address: ${error.message}`);
        return { 
            formatted: 'Address information not available',
            data: { error: 'Could not parse address' }
        };
    }
}

/**
 * Add parsing function for shipping address with async support
 */
async function parseShippingAddressAsync(orderData) {
    try {
        const addressId = orderData.shipping_address || orderData.shippingAddress;
        if (!addressId) {
            return { formatted: '', data: {} };
        }
        
        // Try to fetch address from database
        try {
            const address = await $app.dao().findRecordById('addresses', addressId);
            
            if (address) {
                const addressParts = [];
                if (address.street) addressParts.push(address.street);
                if (address.city) addressParts.push(address.city);
                if (address.state) addressParts.push(address.state);
                if (address.postalCode) addressParts.push(address.postalCode);
                if (address.country) addressParts.push(address.country);
                
                return { 
                    formatted: addressParts.join(', '),
                    data: address
                };
            }
        } catch (error) {
            directLog(`Error fetching address record: ${error.message}`);
        }
        
        // Fallback to parsing from string if direct fetch failed
        return parseShippingAddress(orderData);
    } catch (error) {
        directLog(`Error parsing shipping address async: ${error.message}`);
        return { 
            formatted: 'Address information not available',
            data: { error: 'Could not parse address' }
        };
    }
}

/**
 * Generate an order summary text
 */
function generateOrderSummary(products) {
    try {
        if (products.length === 0) {
            return { text: "No products in order", count: 0 };
        }
        
        let summaryText = "";
        let totalItems = 0;
        
        products.forEach(item => {
            const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
            totalItems += quantity;
            
            const price = item.product?.price || 0;
            const name = item.product?.name || 'Product';
            
            summaryText += `- ${quantity}x ${name} (${formatCurrency(price)})`;
            if (item.color) {
                summaryText += ` - Color: ${item.color}`;
            }
            summaryText += "\n";
        });
        
        return { text: summaryText, count: totalItems };
    } catch (error) {
        directLog(`Error generating order summary: ${error.message}`);
        return { 
            text: "Error generating product list. Please check your order online.", 
            count: 0 
        };
    }
}

/**
 * Process order created hook
 */
async function processOrderCreated(order) {
    try {
        // Skip if order doesn't have valid user information
        if (!order.customer_email) {
            directLog(`Skipping email for order ${order.id} - no customer email`);
            return;
        }
        
        directLog(`Processing new order ${order.id}...`);
        
        // Log basic order info
        logOrderInfo(order, 'New order created');
        
        // Determine if this is a new order
        const eventType = 'created';

        // Send confirmation email
        await sendOrderEmail(order, null, eventType);
        directLog(`Email sent for new order ${order.id}`);
        
        return true;
    } catch (error) {
        directLog(`Error processing new order: ${error.message}`);
        return false;
    }
}

/**
 * Process Razorpay payment status webhook
 */
async function processPaymentWebhook(event, orderId, paymentId, paymentStatus) {
    try {
        directLog(`Processing payment webhook for order ${orderId}`);
        
        if (!orderId) {
            directLog('Invalid webhook: missing order ID');
            return false;
        }
        
        // Get order from database
        const order = await $app.dao().findRecordById('orders', orderId);
        if (!order) {
            directLog(`Order ${orderId} not found`);
            return false;
        }
        
        // Skip if already processed with this status
        if (order.payment_status === paymentStatus) {
            directLog(`Order ${orderId} already has status ${paymentStatus}`);  
            return true;
        }
        
        // Clone order for tracking changes
        const oldOrder = { ...order };
        
        // Update order with payment information
        order.payment_status = paymentStatus;
        if (paymentId) {
            order.payment_id = paymentId;
        }
        
        // Update order status based on payment status
        if (paymentStatus === 'captured' || paymentStatus === 'paid') {
            // Payment successful - mark as processing
            order.status = 'processing';
        } else if (paymentStatus === 'failed') {
            // Payment failed - mark as payment_failed
            order.status = 'payment_failed';
        } else if (paymentStatus === 'refunded') {
            // Payment refunded - mark as cancelled
            order.status = 'cancelled';
        }
        
        // Save changes
        await $app.dao().saveRecord(order);
        
        // Send appropriate email based on payment status
        const eventType = 'payment_' + paymentStatus;
        await sendOrderEmail(order, oldOrder, eventType);
        
        directLog(`Payment status updated for order ${orderId}: ${paymentStatus}`);
        return true;
    } catch (error) {
        directLog(`Error processing payment webhook: ${error.message}`);
        return false;
    }
}

/**
 * Main function to send order email via SMTP
 */
async function sendOrderEmail(order, oldOrder, eventType) {
    // Prevent duplicate processing
    const orderEventKey = `${order.id}_${eventType}_${Date.now()}`;
    if (processedOrders.has(orderEventKey)) {
        directLog(`Skipping duplicate order event: ${orderEventKey}`);
        return true;
    }
    
    // Track this order
    processedOrders.add(orderEventKey);
    
    // Clean old entries
    if (processedOrders.size > 100) {
        const entries = Array.from(processedOrders);
        const newEntries = entries.slice(entries.length - 50);
        processedOrders.clear();
        newEntries.forEach(entry => processedOrders.add(entry));
    }
    
    try {
        directLog(`Preparing to send email for order ${order.id} (${eventType})...`);
        
        // Validate required data
        if (!order || !order.id) {
            return false;
        }
        
        // Get user email
        let userEmail = order.customer_email || null;
        let userName = order.customer_name || null;
        
        // If we don't have customer email directly in the order, try to get it from the user record
        if (!userEmail && order.user) {
            try {
                const user = await $app.dao().findRecordById('users', order.user);
                if (user) {
                    userEmail = user.email;
                    userName = user.name;
                }
            } catch (error) {
                directLog(`Error fetching user data: ${error.message}`);
            }
        }
        
        // If still no email, we can't send
        if (!userEmail) {
            directLog(`No email address found for order ${order.id}`);
            return false;
        }
        
        // Determine base URL for images and links - match the OrderConfirmation component pattern
        const baseUrl = process.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || 'https://pocketbase.konipai.in';
        directLog(`Using base URL for images: ${baseUrl}`);
        
        // Prepare data for email
        try {
            // Parse products
            const products = parseOrderProducts(order);
            const { text: productSummary, count: itemCount } = generateOrderSummary(products);
            
            // Parse shipping address
            let shippingAddress = null;
            if (order.shipping_address || order.shippingAddress) {
                shippingAddress = await parseShippingAddressAsync(order);
            }

            // Prepare email context based on event type
            const emailContext = {
                orderId: order.id,
                userName: userName || 'Valued Customer',
                products,
                itemCount,
                productSummary,
                shippingAddress,
                total: order.total || 0,
                subtotal: order.subtotal || 0,
                shippingCost: order.shipping_cost || 0,
                couponCode: order.coupon_code || null,
                discountAmount: order.discount_amount || 0,
                paymentStatus: order.payment_status || 'pending',
                orderStatus: order.status || 'pending',
                baseUrl: baseUrl
            };

            // Log email context for debugging
            directLog(`Email context prepared with ${products.length} products`);
            if (products.length > 0) {
                directLog(`First product: ID=${products[0].product.id}, Image paths: ${JSON.stringify(products[0].product.images)}`);
            }

            // Send appropriate email based on event type
            let emailResult;
            
            if (eventType === 'created') {
                emailResult = await smtp.sendOrderConfirmationEmail(order, userEmail, userName);
                directLog(`Sent order confirmation email to ${userEmail}`);
            } 
            else if (eventType === 'payment_captured' || eventType === 'payment_paid') {
                emailResult = await smtp.sendOrderStatusEmail(order, userEmail, userName, 'payment_confirmed');
                directLog(`Sent payment confirmation email to ${userEmail}`);
            }
            else if (eventType === 'payment_failed') {
                emailResult = await smtp.sendOrderStatusEmail(order, userEmail, userName, 'payment_failed');
                directLog(`Sent payment failure email to ${userEmail}`);
            }
            else if (eventType === 'status_updated' && oldOrder) {
                const newStatus = order.status;
                emailResult = await smtp.sendOrderStatusEmail(order, userEmail, userName, newStatus);
                directLog(`Sent order status update email (${newStatus}) to ${userEmail}`);
            }
            else {
                directLog(`No email template for event type: ${eventType}`);
                return false;
            }
            
            return emailResult && emailResult.success;
            
        } catch (error) {
            directLog(`Error preparing email data: ${error.message}`);
            return false;
        }
        
    } catch (error) {
        directLog(`Error sending order email: ${error.message}`);
        return false;
    }
}

/**
 * Log order information for debugging
 */
function logOrderInfo(order, message) {
    try {
        if (!order) {
            directLog("Cannot log order info: Order is null or undefined");
            return;
        }
        
        directLog(`${message || 'Order info'}:`);
        directLog(`  ID: ${order.id}`);
        directLog(`  Status: ${order.status}`);
        directLog(`  Total: ${formatCurrency(order.total || order.totalAmount || 0)}`);
        directLog(`  Created: ${order.created}`);
        directLog(`  Updated: ${order.updated}`);
        
        if (order.expand && order.expand.user) {
            directLog(`  Customer: ${order.expand.user.name} (${order.expand.user.email})`);
        }
    } catch (error) {
        directLog(`Error logging order info: ${error.message}`);
    }
}

/**
 * Determine event type based on order changes
 */
function determineEventType(newOrder, oldOrder) {
    if (!oldOrder) {
        return 'created';
    }
    
    if (newOrder.status !== oldOrder.status) {
        return 'status_changed';
    }
    
    return 'updated';
}

// Payment status constants
const PAYMENT_STATUS = {
    PENDING: 'pending',
    CREATED: 'created',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

/**
 * Map Razorpay payment status to our internal status
 */
function mapRazorpayStatus(razorpayStatus) {
    switch (razorpayStatus) {
        case 'created':
            return PAYMENT_STATUS.CREATED;
        case 'authorized':
            return PAYMENT_STATUS.AUTHORIZED;
        case 'captured':
            return PAYMENT_STATUS.CAPTURED;
        case 'refunded':
            return PAYMENT_STATUS.REFUNDED;
        case 'failed':
            return PAYMENT_STATUS.FAILED;
        default:
            return PAYMENT_STATUS.PENDING;
    }
}

/**
 * Process order updated hook
 */
async function processOrderUpdated(newOrder, oldOrder) {
    try {
        const eventType = determineEventType(newOrder, oldOrder);
        debugLog(`Processing order update (${eventType}):`, newOrder.id);
        
        // Only process specific update types
        if (eventType !== 'status_changed' && eventType !== 'created') {
            debugLog('Skipping update that is not status change or creation');
            return true; // Not an error, just nothing to do
        }
        
        // Try to expand the user data
        let user;
        try {
            const usersCollection = $app.dao().findCollectionByNameOrId('users');
            if (newOrder.user) {
                user = await $app.dao().findFirstRecordByData(usersCollection.id, 'id', newOrder.user);
            }
        } catch (e) {
            directLog(`Could not expand user data: ${e.message}`);
        }
        
        if (!user) {
            directLog('WARNING: User data not found for order ' + newOrder.id);
            return false;
        }
        
        return await sendOrderEmail(newOrder, oldOrder, eventType);
    } catch (error) {
        directLog(`Error processing order update: ${error.message}`);
        return false;
    }
}

// Register Razorpay webhook route
$app.onRequest('POST', '/api/razorpay-webhook', (e) => {
    e.bypassAuth = true; // Allow public access
    
    try {
        // Get request body
        const body = JSON.parse(e.bodyString);
        directLog('Received Razorpay webhook:', JSON.stringify(body));
        
        // Extract event details
        const event = body.event || '';
        
        // Validate webhook signature if available
        // This should be implemented for production to verify requests are from Razorpay
        // const signature = e.request.headers.get('X-Razorpay-Signature');
        
        // Handle payment events
        if (event.startsWith('payment.')) {
            const payload = body.payload?.payment?.entity || {};
            
            const paymentId = payload.id || '';
            const orderId = payload.notes?.order_id || '';
            let paymentStatus = '';
            
            // Map Razorpay event to status
            switch (event) {
                case 'payment.authorized':
                    paymentStatus = 'authorized';
                    break;
                case 'payment.captured':
                    paymentStatus = 'captured';
                    break;
                case 'payment.failed':
                    paymentStatus = 'failed';
                    break;
                case 'payment.refunded':
                    paymentStatus = 'refunded';
                    break;
                default:
                    paymentStatus = 'pending';
            }
            
            // Process the payment status update
            if (orderId && paymentStatus) {
                // Process payment asynchronously (don't block response)
                setTimeout(async () => {
                    await processPaymentWebhook(event, orderId, paymentId, paymentStatus);
                }, 0);
            }
        }
        
        // Return success response
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        directLog(`Error processing Razorpay webhook: ${error.message}`);
        
        // Return error response
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

// Register existing hooks
onRecordAfterCreateRequest("orders", (e) => {
    processOrderCreated(e.record);
});

onRecordAfterUpdateRequest("orders", (e) => {
    processOrderUpdated(e.record, e.oldRecord);
});

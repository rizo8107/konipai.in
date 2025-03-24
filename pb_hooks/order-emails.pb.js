/// <reference path="../pb_typings.d.ts" />

/**
 * Order Webhook Integration for PocketBase
 * 
 * This file sets up hooks to send order details to an external webhook
 * for handling email notifications and other order processing tasks
 */

// Webhook URL for sending order data
const WEBHOOK_URL = "https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7";

// Authentication credentials
const AUTH_USERNAME = "nirmal@lifedemy.in";
const AUTH_PASSWORD = "Life@123";

// Debug mode - set to true to enable verbose logging
const DEBUG = true;

/**
 * Debug logger function
 */
function debugLog(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

/**
 * Function to send order details to external webhook
 * @param {object} order - The order record 
 * @param {object} user - The user record
 * @param {string} eventType - The type of event (created, updated, etc.)
 * @returns {boolean} - Success status
 */
async function sendOrderToWebhook(order, user, eventType) {
    try {
        console.log(`Preparing to send order ${order.id} to webhook (${eventType})...`);
        debugLog('Order object:', JSON.stringify(order));
        debugLog('User object:', JSON.stringify(user));
        
        // Function to format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount / 100); // Convert paisa to rupees
        };

        // Parse products if they are stored as a string
        let orderProducts = [];
        try {
            debugLog('Parsing products:', order.products);
            orderProducts = typeof order.products === 'string' 
                ? JSON.parse(order.products) 
                : order.products;
            debugLog('Parsed products:', JSON.stringify(orderProducts));
        } catch (e) {
            console.error('Error parsing products:', e);
            orderProducts = [];
        }

        // Build a formatted shipping address for email templates
        let formattedAddress = '';
        if (order.shipping_address) {
            try {
                debugLog('Parsing shipping address:', order.shipping_address);
                const address = typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address)
                    : order.shipping_address;
                
                const addressParts = [];
                if (address.street) addressParts.push(address.street);
                if (address.city) addressParts.push(address.city);
                if (address.state) addressParts.push(address.state);
                if (address.postalCode) addressParts.push(address.postalCode);
                if (address.country) addressParts.push(address.country);
                
                formattedAddress = addressParts.join(', ');
                debugLog('Formatted address:', formattedAddress);
            } catch (e) {
                console.error('Error parsing shipping address:', e);
                formattedAddress = 'Address information not available';
            }
        }

        // Create a readable order summary for emails
        let orderSummary = "";
        let totalItems = 0;

        try {
            debugLog('Generating order summary from products');
            orderProducts.forEach(item => {
                totalItems += item.quantity || 0;
                orderSummary += `- ${item.quantity || 1}x ${item.name || 'Product'} (${formatCurrency(item.price || 0)})`;
                if (item.color) {
                    orderSummary += ` - Color: ${item.color}`;
                }
                orderSummary += "\n";
            });
            debugLog('Generated order summary:', orderSummary);
        } catch (e) {
            console.error("Error generating product list:", e);
            orderSummary = "Error generating product list. Please check your order online.";
        }

        // Prepare the order data for the webhook
        const orderForWebhook = {
            // Event metadata
            eventType: eventType,
            notificationType: 'order_' + eventType,
            timestamp: new Date().toISOString(),
            
            // Order details
            orderId: order.id,
            orderDate: order.created,
            updatedDate: order.updated,
            
            // Customer information
            customerInfo: {
                name: user.name,
                email: user.email,
                phone: order.customer_phone || user.phone || ""
            },
            
            // Address information
            shippingAddress: order.shipping_address || {},
            formattedAddress: formattedAddress,
            
            // Payment information
            paymentInfo: {
                paymentId: order.payment_id,
                paymentOrderId: order.payment_order_id,
                paymentStatus: order.payment_status
            },
            
            // Order status
            orderStatus: order.status,
            
            // Product information
            products: orderProducts.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                color: item.color,
                imageUrl: item.image
            })),
            totalItems: totalItems,
            orderSummary: orderSummary,
            
            // Financial details
            financialDetails: {
                subtotal: order.subtotal || order.totalAmount,
                shippingCost: order.shipping_cost || 0,
                total: order.total || order.totalAmount,
                subtotalFormatted: formatCurrency(order.subtotal || order.totalAmount),
                shippingCostFormatted: formatCurrency(order.shipping_cost || 0),
                totalFormatted: formatCurrency(order.total || order.totalAmount)
            },
            
            // Email template data
            emailTemplateData: {
                siteName: "Konipai",
                siteUrl: "https://konipai.in",
                logoUrl: "https://konipai.in/assets/logo.png",
                year: new Date().getFullYear(),
                viewOrderUrl: `https://konipai.in/orders/${order.id}`,
                supportEmail: "contact@konipai.in",
                supportPhone: "+91 9363020252"
            }
        };

        debugLog('Prepared webhook payload:', JSON.stringify(orderForWebhook));
        
        // Log the webhook URL
        debugLog('Sending to webhook URL:', WEBHOOK_URL);

        // Create basic auth credentials
        const base64Credentials = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');
        const authHeader = `Basic ${base64Credentials}`;
        debugLog('Using auth header:', authHeader);

        // Use fetch to send the data to the webhook
        console.log(`Attempting to send order ${order.id} to webhook...`);
        
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(orderForWebhook),
            });

            debugLog('Webhook response status:', response.status);
            
            // Check if the request was successful
            if (response.ok) {
                let respText;
                try {
                    respText = await response.text();
                    debugLog('Webhook response body:', respText);
                } catch (e) {
                    debugLog('Failed to read response body', e);
                }
                
                console.log(`✅ Successfully sent order ${order.id} to webhook (${eventType})`);
                return true;
            } else {
                const responseText = await response.text();
                console.error(`❌ Failed to send order to webhook: ${response.status} ${response.statusText}`);
                console.error(`Response: ${responseText}`);
                return false;
            }
        } catch (fetchError) {
            console.error(`❌ Network error when sending to webhook:`, fetchError);
            
            // Try a direct XMLHttpRequest approach as a fallback
            console.log('Trying alternative approach to send webhook...');
            
            try {
                // Direct HTTP request via a different method
                const alternativeResult = await $http.send({
                    url: WEBHOOK_URL,
                    method: 'POST',
                    body: JSON.stringify(orderForWebhook),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    }
                });
                
                debugLog('Alternative request response:', alternativeResult);
                
                if (alternativeResult && alternativeResult.statusCode >= 200 && alternativeResult.statusCode < 300) {
                    console.log(`✅ Successfully sent order ${order.id} to webhook using alternative method`);
                    return true;
                } else {
                    console.error(`❌ Alternative request also failed:`, alternativeResult);
                    return false;
                }
            } catch (altError) {
                console.error(`❌ Alternative request also failed with error:`, altError);
                return false;
            }
        }
    } catch (error) {
        console.error(`Error sending order to webhook:`, error);
        return false;
    }
}

// Hook for when an order is created
onRecordAfterCreateRequest("orders", (e) => {
    try {
        // Get the created order record
        const order = e.record;
        
        debugLog('Order created hook triggered for order:', order.id);
        
        // Fetch the user information
        const userRecord = $app.dao().findRecordById("users", order.user);
        
        if (!userRecord) {
            console.error("User not found for order:", order.id);
            return;
        }
        
        debugLog('Found user record:', userRecord.id);
        
        // Always send to webhook with event type "created"
        sendOrderToWebhook(order, userRecord, "created")
            .then(success => {
                if (success) {
                    console.log(`Order ${order.id} creation event successfully sent to webhook`);
                } else {
                    console.error(`Failed to send order ${order.id} creation event to webhook`);
                }
            })
            .catch(error => {
                console.error(`Error in webhook process for order ${order.id}:`, error);
            });
    } catch (error) {
        console.error("Error in onRecordAfterCreateRequest hook:", error);
    }
});

// Hook for when an order is updated
onRecordAfterUpdateRequest("orders", (e) => {
    try {
        const record = e.record;
        const oldRecord = e.oldRecord;
        
        debugLog('Order updated hook triggered for order:', record.id);
        
        // Get the user information
        const userRecord = $app.dao().findRecordById("users", record.user);
        
        if (!userRecord) {
            console.error("User not found for order:", record.id);
            return;
        }
        
        debugLog('Found user record:', userRecord.id);
        
        // Determine event type based on what changed
        let eventType = "updated";
        
        // Check for specific changes to determine more specific event types
        if (record.status !== oldRecord.status) {
            eventType = `status_changed_to_${record.status}`;
            console.log(`Order ${record.id} status changed from ${oldRecord.status} to ${record.status}`);
        } else if (record.payment_status !== oldRecord.payment_status) {
            eventType = `payment_status_changed_to_${record.payment_status}`;
            console.log(`Order ${record.id} payment status changed from ${oldRecord.payment_status} to ${record.payment_status}`);
        }
        
        debugLog('Determined event type:', eventType);
        
        // Always send to webhook with the appropriate event type
        sendOrderToWebhook(record, userRecord, eventType)
            .then(success => {
                if (success) {
                    console.log(`Order ${record.id} update (${eventType}) successfully sent to webhook`);
                } else {
                    console.error(`Failed to send order ${record.id} update (${eventType}) to webhook`);
                }
            })
            .catch(error => {
                console.error(`Error in webhook process for order ${record.id} update:`, error);
            });
    } catch (error) {
        console.error("Error in onRecordAfterUpdateRequest hook:", error);
    }
}); 
/// <reference path="../pb_typings.d.ts" />

/**
 * Order Webhook Integration for PocketBase
 * 
 * This file sets up hooks to send order details to an external webhook
 * for handling email notifications through n8n.
 */

// Webhook configuration
const WEBHOOK_URL = "https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7";
const AUTH_USERNAME = "nirmal@lifedemy.in";
const AUTH_PASSWORD = "Life@123";

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
        console.log(`[WEBHOOK LOG] ${message}`);
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
 * Main function to send order details to webhook
 */
async function sendOrderToWebhook(order, user, eventType) {
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
        directLog(`Preparing to send order ${order.id} to webhook (${eventType})...`);
        
        // Validate required data
        if (!order || !order.id) {
            directLog('ERROR: Invalid order object - missing ID');
            return false;
        }

        if (!user || !user.email) {
            directLog('ERROR: Invalid user object - missing email');
            return false;
        }
        
        // Parse order data
        const products = parseOrderProducts(order);
        const { formatted: formattedAddress, data: shippingAddressObj } = parseShippingAddress(order);
        const { text: orderSummary, count: totalItems } = generateOrderSummary(products);
        
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
                name: user.name || 'Customer',
                email: user.email,
                phone: order.customer_phone || user.phone || ""
            },
            
            // Address information
            shippingAddress: shippingAddressObj,
            formattedAddress: formattedAddress,
            
            // Payment information
            paymentInfo: {
                paymentId: order.payment_id || '',
                paymentOrderId: order.payment_order_id || '',
                paymentStatus: order.payment_status || 'pending'
            },
            
            // Order status
            orderStatus: order.status || 'pending',
            
            // Product information
            products: products.map(item => {
                // Get core product details
                const productId = item.productId;
                const productName = item.product.name;
                const productPrice = item.product.price;
                const quantity = item.quantity;
                const color = item.color;
                
                // Generate image URL exactly as done in OrderConfirmation.tsx
                let imageUrl = '';
                
                try {
                    // Directly copied from OrderConfirmation.tsx approach:
                    // src={`${import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || 'https://pocketbase.konipai.in'}/api/files/pbc_4092854851/${item.product.id}/${item.product.images[0].split('/').pop()}`}
                    if (item.product.images && item.product.images[0]) {
                        const pocketbaseUrl = 'https://pocketbase.konipai.in';
                        const collectionId = 'pbc_4092854851';
                        const imageName = item.product.images[0].split('/').pop();
                        
                        imageUrl = `${pocketbaseUrl}/api/files/${collectionId}/${productId}/${imageName}`;
                        directLog(`Image URL for product ${productName}: ${imageUrl}`);
                    } else {
                        directLog(`No images found for product ${productName} (ID: ${productId})`);
                    }
                } catch (error) {
                    directLog(`Error generating image URL: ${error.message}`);
                }
                
                return {
                    productId,
                    name: productName,
                    quantity,
                    price: productPrice,
                    color,
                    imageUrl
                };
            }),
            totalItems,
            orderSummary,
            
            // Financial details
            financialDetails: {
                subtotal: order.subtotal || order.totalAmount || 0,
                shippingCost: order.shipping_cost || 0,
                total: order.total || order.totalAmount || 0,
                subtotalFormatted: formatCurrency(order.subtotal || order.totalAmount || 0),
                shippingCostFormatted: formatCurrency(order.shipping_cost || 0),
                totalFormatted: formatCurrency(order.total || order.totalAmount || 0)
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
        
        // Send the data to the webhook
        return await sendDataToWebhook(orderForWebhook, order.id, eventType);
    } catch (error) {
        directLog(`Error preparing webhook data: ${error.message}`);
        return false;
    }
}

/**
 * Send prepared data to the webhook endpoint
 */
async function sendDataToWebhook(data, orderId, eventType) {
    // Create authentication header
    const base64Credentials = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');
    const authHeader = `Basic ${base64Credentials}`;
    
    directLog(`Sending order ${orderId} to webhook...`);
    
    try {
        // Primary method using fetch
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(data),
        });
        
        if (response.ok) {
            directLog(`✅ Successfully sent order ${orderId} (${eventType}) to webhook`);
            return true;
        } else {
            const responseText = await response.text();
            directLog(`❌ Webhook error: ${response.status} ${response.statusText}`);
            directLog(`Response: ${responseText}`);
            
            // Try alternative method
            return await sendDataAlternativeMethod(data, orderId, eventType, authHeader);
        }
    } catch (error) {
        directLog(`❌ Webhook network error: ${error.message}`);
        return await sendDataAlternativeMethod(data, orderId, eventType, authHeader);
    }
}

/**
 * Alternative method to send data if the primary method fails
 */
async function sendDataAlternativeMethod(data, orderId, eventType, authHeader) {
    directLog('Trying alternative method to send webhook...');
    
    try {
        const alternativeResult = await $http.send({
            url: WEBHOOK_URL,
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });
        
        if (alternativeResult && alternativeResult.statusCode >= 200 && alternativeResult.statusCode < 300) {
            directLog(`✅ Successfully sent order ${orderId} (${eventType}) with alternative method`);
            return true;
        } else {
            directLog(`❌ Alternative method failed: Status ${alternativeResult?.statusCode || 'unknown'}`);
            return false;
        }
    } catch (error) {
        directLog(`❌ Alternative method error: ${error.message}`);
        return false;
    }
}

/**
 * Log order information for debugging
 */
function logOrderInfo(order, message) {
    if (!DEBUG) return;
    
    directLog(`${message || 'Order Info'} - Order ID: ${order.id}`);
    directLog(`Status: ${order.status}, Payment Status: ${order.payment_status}`);
    directLog(`Created: ${order.created}, Updated: ${order.updated}`);
    
    try {
        const products = typeof order.products === 'string' 
            ? JSON.parse(order.products) 
            : order.products;
        
        directLog(`Products: ${products ? products.length : 0}`);
        if (products && products.length > 0) {
            products.forEach((p, i) => {
                directLog(`Product ${i+1}: ${p.name || p.product?.name}, Qty: ${p.quantity}`);
            });
        }
    } catch (e) {
        directLog(`Could not parse products: ${e.message}`);
    }
}

/**
 * Determine event type based on order changes
 */
function determineEventType(newOrder, oldOrder) {
    if (newOrder.status !== oldOrder.status) {
        return `status_changed_to_${newOrder.status}`;
    } else if (newOrder.payment_status !== oldOrder.payment_status) {
        return `payment_status_changed_to_${newOrder.payment_status}`;
    } else {
        return "updated";
    }
}

/**
 * Process order created hook
 */
function processOrderCreated(order) {
    directLog(`🔔 Order created: ${order.id}`);
    logOrderInfo(order, 'New Order Created');
    
    // Get the user information
    try {
        const userRecord = $app.dao().findRecordById("users", order.user);
        
        if (!userRecord) {
            directLog(`❌ User not found for order: ${order.id}`);
            return;
        }
        
        // Send to webhook
        sendOrderToWebhook(order, userRecord, "created")
            .then(success => {
                directLog(`Order creation webhook ${success ? 'succeeded' : 'failed'}`);
            })
            .catch(error => {
                directLog(`❌ Order creation webhook error: ${error.message}`);
            });
    } catch (error) {
        directLog(`❌ Error processing created order: ${error.message}`);
    }
}

/**
 * Process order updated hook
 */
function processOrderUpdated(newOrder, oldOrder) {
    directLog(`🔄 Order updated: ${newOrder.id}`);
    logOrderInfo(newOrder, 'Order Updated');
    
    // Get the user information
    try {
        const userRecord = $app.dao().findRecordById("users", newOrder.user);
        
        if (!userRecord) {
            directLog(`❌ User not found for order: ${newOrder.id}`);
            return;
        }
        
        // Determine what changed
        const eventType = determineEventType(newOrder, oldOrder);
        directLog(`Change type: ${eventType}`);
        
        // Send to webhook
        sendOrderToWebhook(newOrder, userRecord, eventType)
            .then(success => {
                directLog(`Order update webhook ${success ? 'succeeded' : 'failed'}`);
            })
            .catch(error => {
                directLog(`❌ Order update webhook error: ${error.message}`);
            });
    } catch (error) {
        directLog(`❌ Error processing updated order: ${error.message}`);
    }
}

// Register hooks
onRecordAfterCreateRequest("orders", (e) => {
    processOrderCreated(e.record);
});

onRecordAfterUpdateRequest("orders", (e) => {
    processOrderUpdated(e.record, e.oldRecord);
});
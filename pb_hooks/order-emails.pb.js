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
 * Direct log to PocketBase console - use for important operational logs
 */
function directLog(message) {
    try {
        console.log('============================');
        console.log(`[WEBHOOK LOG] ${message}`);
        console.log('============================');
    } catch (e) {
        // Fail silently if logging doesn't work
    }
}

// Keep track of which orders we've processed to avoid duplicates
const processedOrders = new Set();

/**
 * Function to send order details to external webhook
 * @param {object} order - The order record 
 * @param {object} user - The user record
 * @param {string} eventType - The type of event (created, updated, etc.)
 * @returns {boolean} - Success status
 */
async function sendOrderToWebhook(order, user, eventType) {
    // Check if we've already processed this exact order + event combination
    const orderEventKey = `${order.id}_${eventType}_${Date.now()}`;
    if (processedOrders.has(orderEventKey)) {
        console.log(`Skipping duplicate order event: ${orderEventKey}`);
        return true;
    }

    // Mark this order as being processed
    processedOrders.add(orderEventKey);
    
    // Clean old entries from the Set to avoid memory leaks
    if (processedOrders.size > 100) {
        // Keep only the 50 most recent entries
        const entries = Array.from(processedOrders);
        const newEntries = entries.slice(entries.length - 50);
        processedOrders.clear();
        newEntries.forEach(entry => processedOrders.add(entry));
    }

    try {
        directLog(`Preparing to send order ${order.id} to webhook (${eventType})...`);
        debugLog('Order object:', JSON.stringify(order));
        debugLog('User object:', JSON.stringify(user));
        
        if (!order || !order.id) {
            directLog('ERROR: Invalid order object - missing ID');
            return false;
        }

        if (!user || !user.email) {
            directLog('ERROR: Invalid user object - missing email');
            return false;
        }
        
        // Function to format currency
        const formatCurrency = (amount) => {
            if (typeof amount !== 'number') {
                amount = Number(amount) || 0;
            }
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount / 100); // Convert paisa to rupees
        };

        // Parse products if they are stored as a string
        let orderProducts = [];
        try {
            debugLog('Parsing products:', order.products);
            if (!order.products) {
                directLog('WARNING: Order has no products array');
                orderProducts = [];
            } else {
                orderProducts = typeof order.products === 'string' 
                    ? JSON.parse(order.products) 
                    : order.products;
                
                // Ensure orderProducts is an array
                if (!Array.isArray(orderProducts)) {
                    directLog('WARNING: Products is not an array, converting to empty array');
                    orderProducts = [];
                }
                
                // Pre-process the products to ensure consistent format
                orderProducts = orderProducts.map(item => {
                    // Debug the raw item structure
                    debugLog('Raw product item:', JSON.stringify(item));
                    
                    // Handle different possible product structures
                    let productId, productName, productPrice, productImages;
                    let quantity = 1;
                    let color = '';
                    
                    // Extract product details
                    if (item.product) {
                        // New format: { product: {...}, quantity: 1, color: '...' }
                        debugLog('Processing product in new format (with product object)');
                        productId = item.product.id || item.productId || '';
                        productName = item.product.name || 'Product';
                        productPrice = item.product.price || 0;
                        debugLog('Product images from new format:', JSON.stringify(item.product.images));
                        productImages = item.product.images || [];
                        quantity = item.quantity || 1;
                        color = item.color || '';
                    } else {
                        // Legacy format: { productId: '...', name: '...', price: 100, ... }
                        debugLog('Processing product in legacy format (flat object)');
                        productId = item.productId || '';
                        productName = item.name || 'Product';
                        productPrice = item.price || 0;
                        debugLog('Product images from legacy format:', JSON.stringify(item.images));
                        productImages = item.images || [];
                        quantity = item.quantity || 1;
                        color = item.color || '';
                    }
                    
                    return {
                        productId,
                        product: {
                            id: productId,
                            name: productName,
                            price: productPrice,
                            images: productImages
                        },
                        quantity,
                        color
                    };
                });
                
                // Log the processed products for debugging
                directLog(`Processed ${orderProducts.length} products for order ${order.id}`);
                orderProducts.forEach((product, index) => {
                    directLog(`Product ${index+1}: ${product.product.name}, ID: ${product.productId}`);
                    directLog(`  Images: ${JSON.stringify(product.product.images)}`);
                });
            }
            debugLog('Parsed products:', JSON.stringify(orderProducts));
        } catch (e) {
            console.error('Error parsing products:', e);
            orderProducts = [];
        }

        // Build a formatted shipping address for email templates
        let formattedAddress = '';
        let shippingAddressObj = {};
        if (order.shipping_address) {
            try {
                debugLog('Parsing shipping address:', order.shipping_address);
                const address = typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address) 
                    : order.shipping_address;
                
                shippingAddressObj = address;
                
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
                shippingAddressObj = { error: 'Could not parse address' };
            }
        } else {
            directLog('WARNING: Order has no shipping address');
        }

        // Create a readable order summary for emails
        let orderSummary = "";
        let totalItems = 0;

        try {
            debugLog('Generating order summary from products');
            if (orderProducts.length === 0) {
                orderSummary = "No products in order";
            } else {
                orderProducts.forEach(item => {
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    totalItems += quantity;
                    
                    // Use the product information from the normalized structure
                    const price = item.product?.price || 0;
                    const name = item.product?.name || 'Product';
                    
                    orderSummary += `- ${quantity}x ${name} (${formatCurrency(price)})`;
                    if (item.color) {
                        orderSummary += ` - Color: ${item.color}`;
                    }
                    orderSummary += "\n";
                });
            }
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
            products: orderProducts.map(item => {
                // Generate product image URL if product has images
                let imageUrl = '';
                try {
                    const productId = item.productId || (item.product ? item.product.id : '');
                    
                    // Get images directly from the product object or database
                    let productImages = [];
                    if (productId) {
                        try {
                            // First try directly from the product data
                            if (item.product && item.product.images && item.product.images.length > 0) {
                                productImages = item.product.images;
                                directLog(`Using images from product data: ${JSON.stringify(productImages)}`);
                            } else {
                                // If not available in the product data, get from database
                                directLog(`Fetching product ${productId} from database to get images...`);
                                const productRecord = $app.dao().findRecordById("pbc_4092854851", productId);
                                
                                if (productRecord) {
                                    directLog(`Found product ${productId} in database`);
                                    // Extract images from the product record
                                    productImages = productRecord.get('images') || [];
                                    directLog(`Product images from database: ${JSON.stringify(productImages)}`);
                                } else {
                                    directLog(`Product ${productId} not found in database`);
                                }
                            }
                        } catch (dbError) {
                            directLog(`Error fetching product images: ${dbError.message}`);
                        }
                    }
                    
                    // Generate the image URL exactly like the OrderDetail page does
                    if (productImages.length > 0 && productId) {
                        // Generate URL in the exact same format as the OrderDetail page:
                        // ${import.meta.env.VITE_POCKETBASE_URL.replace(/\/$/, '')}/api/files/pbc_4092854851/${item.product.id}/${item.product.images[0].split('/').pop()}
                        
                        const pocketbaseUrl = 'https://pocketbase.konipai.in';
                        const collectionId = 'pbc_4092854851'; // products collection
                        
                        // Handle image filename extraction
                        let imagePath = productImages[0];
                        let imageName = '';
                        
                        // Extract just the filename
                        if (typeof imagePath === 'string') {
                            if (imagePath.includes('/')) {
                                imageName = imagePath.split('/').pop();
                            } else {
                                imageName = imagePath;
                            }
                            directLog(`Using image name: ${imageName}`);
                            
                            // Construct the URL in exactly the same way as the OrderDetail page
                            imageUrl = `${pocketbaseUrl}/api/files/${collectionId}/${productId}/${imageName}`;
                            directLog(`Generated image URL: ${imageUrl}`);
                        } else {
                            directLog(`Unable to use image path: ${imagePath}`);
                        }
                    } else {
                        directLog(`No product images found for product ${productId}`);
                    }
                } catch (e) {
                    console.error('Error generating product image URL:', e);
                    directLog(`Failed to generate image URL for product: ${e.message}`);
                }

                return {
                    productId: item.productId || (item.product ? item.product.id : '') || '',
                    name: item.product ? item.product.name : (item.name || 'Product'),
                    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
                    price: item.product ? item.product.price : (typeof item.price === 'number' ? item.price : 0),
                    color: item.color || '',
                    imageUrl: imageUrl
                };
            }),
            totalItems: totalItems,
            orderSummary: orderSummary,
            
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

        debugLog('Prepared webhook payload:', JSON.stringify(orderForWebhook));
        
        // Log the webhook URL
        debugLog('Sending to webhook URL:', WEBHOOK_URL);

        // Create basic auth credentials
        const base64Credentials = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');
        const authHeader = `Basic ${base64Credentials}`;
        debugLog('Using auth header:', authHeader);

        // Use fetch to send the data to the webhook
        directLog(`Attempting to send order ${order.id} to webhook...`);
        
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
                
                directLog(`✅ Successfully sent order ${order.id} to webhook (${eventType})`);
                return true;
            } else {
                const responseText = await response.text();
                directLog(`❌ Failed to send order to webhook: ${response.status} ${response.statusText}`);
                directLog(`Response: ${responseText}`);
                return false;
            }
        } catch (fetchError) {
            directLog(`❌ Network error when sending to webhook: ${fetchError.message}`);
            
            // Try a direct XMLHttpRequest approach as a fallback
            directLog('Trying alternative approach to send webhook...');
            
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
                    directLog(`✅ Successfully sent order ${order.id} to webhook using alternative method`);
                    return true;
                } else {
                    directLog(`❌ Alternative request also failed: Status ${alternativeResult?.statusCode || 'unknown'}`);
                    return false;
                }
            } catch (altError) {
                directLog(`❌ Alternative request also failed with error: ${altError.message}`);
                return false;
            }
        }
    } catch (error) {
        directLog(`Error sending order to webhook: ${error.message}`);
        return false;
    }
}

/**
 * Debug function to print information about the order
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
                directLog(`Product ${i+1}: ${p.name}, Qty: ${p.quantity}, Price: ${p.price}`);
            });
        }
    } catch (e) {
        directLog(`Could not parse products: ${e.message}`);
    }
}

// Hook for when an order is created
onRecordAfterCreateRequest("orders", (e) => {
    try {
        // Get the created order record
        const order = e.record;
        
        directLog(`🔔 Order created hook triggered for order: ${order.id}`);
        logOrderInfo(order, 'New Order Created');
        
        // Fetch the user information
        const userRecord = $app.dao().findRecordById("users", order.user);
        
        if (!userRecord) {
            directLog(`❌ User not found for order: ${order.id}`);
            return;
        }
        
        debugLog('Found user record:', userRecord.id);
        directLog(`User found: ${userRecord.email}`);
        
        // Always send to webhook with event type "created"
        sendOrderToWebhook(order, userRecord, "created")
            .then(success => {
                if (success) {
                    directLog(`✅ Order ${order.id} creation event successfully sent to webhook`);
                } else {
                    directLog(`❌ Failed to send order ${order.id} creation event to webhook`);
                }
            })
            .catch(error => {
                directLog(`❌ Error in webhook process for order ${order.id}: ${error.message}`);
            });
    } catch (error) {
        directLog(`❌ Error in onRecordAfterCreateRequest hook: ${error.message}`);
    }
});

// Hook for when an order is updated
onRecordAfterUpdateRequest("orders", (e) => {
    try {
        const record = e.record;
        const oldRecord = e.oldRecord;
        
        directLog(`🔄 Order updated hook triggered for order: ${record.id}`);
        logOrderInfo(record, 'Order Updated');
        
        // Get the user information
        const userRecord = $app.dao().findRecordById("users", record.user);
        
        if (!userRecord) {
            directLog(`❌ User not found for order: ${record.id}`);
            return;
        }
        
        debugLog('Found user record:', userRecord.id);
        directLog(`User found: ${userRecord.email}`);
        
        // Determine event type based on what changed
        let eventType = "updated";
        
        // Check for specific changes to determine more specific event types
        if (record.status !== oldRecord.status) {
            eventType = `status_changed_to_${record.status}`;
            directLog(`Order ${record.id} status changed from ${oldRecord.status} to ${record.status}`);
        } else if (record.payment_status !== oldRecord.payment_status) {
            eventType = `payment_status_changed_to_${record.payment_status}`;
            directLog(`Order ${record.id} payment status changed from ${oldRecord.payment_status} to ${record.payment_status}`);
        }
        
        debugLog('Determined event type:', eventType);
        
        // Always send to webhook with the appropriate event type
        sendOrderToWebhook(record, userRecord, eventType)
            .then(success => {
                if (success) {
                    directLog(`✅ Order ${record.id} update (${eventType}) successfully sent to webhook`);
                } else {
                    directLog(`❌ Failed to send order ${record.id} update (${eventType}) to webhook`);
                }
            })
            .catch(error => {
                directLog(`❌ Error in webhook process for order ${record.id} update: ${error.message}`);
            });
    } catch (error) {
        directLog(`❌ Error in onRecordAfterUpdateRequest hook: ${error.message}`);
    }
}); 
/// <reference path="../pb_typings.d.ts" />

/**
 * Order Email Notifications and Webhook Integration for PocketBase
 * 
 * This file sets up hooks to:
 * 1. Send email notifications when orders are created or updated
 * 2. Send order details to an external webhook for further processing
 */

// Webhook URL for sending order data
const WEBHOOK_URL = "https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7";

// Function to send an order confirmation email
function sendOrderConfirmationEmail(order, user) {
    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount / 100); // Razorpay amounts are in paisa
    };

    // Create a readable order summary
    let orderSummary = "";
    let totalItems = 0;

    try {
        const products = JSON.parse(order.products);
        products.forEach(item => {
            totalItems += item.quantity;
            orderSummary += `- ${item.quantity}x ${item.name} (${formatCurrency(item.price)})`;
            if (item.color) {
                orderSummary += ` - Color: ${item.color}`;
            }
            orderSummary += "\n";
        });
    } catch (e) {
        console.error("Error parsing products:", e);
        orderSummary = "Error generating product list. Please check your order online.";
    }

    // Create the email content
    const subject = `Konipai Order Confirmation #${order.id}`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://konipai.in/assets/logo.png" alt="Konipai Logo" style="max-width: 150px;">
            </div>
            
            <h1 style="color: #333; text-align: center;">Your Order is Confirmed!</h1>
            
            <p>Hello ${user.name},</p>
            
            <p>Thank you for your order! We're pleased to confirm that we've received your order and it's being processed.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #444; font-size: 18px;">Order Details</h2>
                <p><strong>Order Number:</strong> #${order.id}</p>
                <p><strong>Order Date:</strong> ${new Date(order.created).toLocaleDateString()}</p>
                <p><strong>Order Status:</strong> ${order.status}</p>
                <p><strong>Payment Status:</strong> ${order.payment_status || 'Processing'}</p>
            </div>
            
            <h3 style="color: #444;">Order Summary (${totalItems} items)</h3>
            <pre style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${orderSummary}</pre>
            
            <div style="margin: 20px 0; padding: 10px 0; border-top: 1px solid #e1e1e1; border-bottom: 1px solid #e1e1e1;">
                <p><strong>Subtotal:</strong> ${formatCurrency(order.totalAmount)}</p>
                <p><strong>Shipping:</strong> ${formatCurrency(order.shipping_fee || 0)}</p>
                <h3 style="color: #444;">Total: ${formatCurrency(order.totalAmount + (order.shipping_fee || 0))}</h3>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #444; font-size: 18px;">Shipping Address</h3>
                <p>${order.shipping_address || 'Address information not available'}</p>
            </div>
            
            <p>You can view the details of your order by <a href="https://konipai.in/orders/${order.id}" style="color: #007bff; text-decoration: none;">clicking here</a>.</p>
            
            <p>If you have any questions about your order, please contact our customer service at:</p>
            <p>Email: <a href="mailto:contact@konipai.in" style="color: #007bff; text-decoration: none;">contact@konipai.in</a></p>
            <p>Phone: +91 9363020252</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #777; font-size: 12px;">
                <p>Thank you for shopping with Konipai!</p>
                <p>&copy; ${new Date().getFullYear()} Konipai. All rights reserved.</p>
            </div>
        </div>
    `;

    // Send the email using PocketBase's email sending functionality
    try {
        $app.newMailClient().send(
            "contact@konipai.in", // from address
            user.email, // to address
            subject,
            htmlContent
        );
        console.log(`Order confirmation email sent to ${user.email} for order #${order.id}`);
        return true;
    } catch (error) {
        console.error(`Failed to send order confirmation email: ${error}`);
        return false;
    }
}

/**
 * Function to send order details to external webhook
 * @param {object} order - The order record 
 * @param {object} user - The user record
 * @returns {boolean} - Success status
 */
async function sendOrderToWebhook(order, user) {
    try {
        console.log(`Preparing to send order ${order.id} to webhook...`);
        
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
            orderProducts = typeof order.products === 'string' 
                ? JSON.parse(order.products) 
                : order.products;
        } catch (e) {
            console.error('Error parsing products:', e);
            orderProducts = [];
        }

        // Prepare the order data for the webhook
        const orderForWebhook = {
            orderId: order.id,
            orderDate: order.created,
            updatedDate: order.updated,
            customerInfo: {
                name: user.name,
                email: user.email,
                phone: order.customer_phone || user.phone || ""
            },
            shippingAddress: order.shipping_address || {},
            paymentInfo: {
                paymentId: order.payment_id,
                paymentOrderId: order.payment_order_id,
                paymentStatus: order.payment_status
            },
            orderStatus: order.status,
            products: orderProducts.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                color: item.color,
                imageUrl: item.image
            })),
            financialDetails: {
                subtotal: order.subtotal || order.totalAmount,
                shippingCost: order.shipping_cost || 0,
                total: order.total || order.totalAmount,
                subtotalFormatted: formatCurrency(order.subtotal || order.totalAmount),
                shippingCostFormatted: formatCurrency(order.shipping_cost || 0),
                totalFormatted: formatCurrency(order.total || order.totalAmount)
            }
        };

        // Use fetch to send the data to the webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderForWebhook),
        });

        // Check if the request was successful
        if (response.ok) {
            console.log(`✅ Successfully sent order ${order.id} to webhook`);
            return true;
        } else {
            const responseText = await response.text();
            console.error(`❌ Failed to send order to webhook: ${response.status} ${response.statusText}`);
            console.error(`Response: ${responseText}`);
            return false;
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
        
        // Fetch the user information
        const userRecord = $app.dao().findRecordById("users", order.user);
        
        if (!userRecord) {
            console.error("User not found for order:", order.id);
            return;
        }
        
        // Send confirmation email
        sendOrderConfirmationEmail(order, userRecord);
        
        // Send to webhook if order is confirmed or paid
        if (order.status === 'processing' || order.payment_status === 'paid') {
            sendOrderToWebhook(order, userRecord)
                .then(success => {
                    if (success) {
                        console.log(`Order ${order.id} successfully sent to webhook`);
                    } else {
                        console.error(`Failed to send order ${order.id} to webhook`);
                    }
                })
                .catch(error => {
                    console.error(`Error in webhook process for order ${order.id}:`, error);
                });
        }
    } catch (error) {
        console.error("Error in onRecordAfterCreateRequest hook:", error);
    }
});

// Hook for when an order status is updated (for shipping notifications, etc.)
onRecordAfterUpdateRequest("orders", (e) => {
    try {
        const record = e.record;
        const oldRecord = e.oldRecord;
        
        // Get the user information
        const userRecord = $app.dao().findRecordById("users", record.user);
        
        if (!userRecord) {
            console.error("User not found for order:", record.id);
            return;
        }
        
        // Handle status changes
        if (record.status !== oldRecord.status) {
            console.log(`Order ${record.id} status changed from ${oldRecord.status} to ${record.status}`);
            
            // If order has been confirmed or moved to processing, send to webhook
            if (
                (record.status === 'processing' && oldRecord.status === 'pending') ||
                (record.status === 'confirmed' && oldRecord.status === 'pending') ||
                (record.payment_status === 'paid' && oldRecord.payment_status !== 'paid')
            ) {
                console.log(`Order ${record.id} confirmed/paid - sending to webhook`);
                sendOrderToWebhook(record, userRecord)
                    .then(success => {
                        if (success) {
                            console.log(`Order ${record.id} successfully sent to webhook`);
                        } else {
                            console.error(`Failed to send order ${record.id} to webhook`);
                        }
                    })
                    .catch(error => {
                        console.error(`Error in webhook process for order ${record.id}:`, error);
                    });
            }
            
            // TODO: Implement different email templates based on status change
            // e.g., shipping confirmation, delivery confirmation, etc.
        }
        
        // Handle payment status changes
        if (record.payment_status !== oldRecord.payment_status) {
            console.log(`Order ${record.id} payment status changed from ${oldRecord.payment_status} to ${record.payment_status}`);
            
            // If payment has been confirmed, send to webhook
            if (record.payment_status === 'paid' && oldRecord.payment_status !== 'paid') {
                console.log(`Order ${record.id} payment confirmed - sending to webhook`);
                sendOrderToWebhook(record, userRecord)
                    .then(success => {
                        if (success) {
                            console.log(`Order ${record.id} successfully sent to webhook after payment`);
                        } else {
                            console.error(`Failed to send order ${record.id} to webhook after payment`);
                        }
                    })
                    .catch(error => {
                        console.error(`Error in webhook process for order ${record.id} after payment:`, error);
                    });
            }
        }
    } catch (error) {
        console.error("Error in onRecordAfterUpdateRequest hook:", error);
    }
}); 
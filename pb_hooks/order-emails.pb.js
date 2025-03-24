/// <reference path="../pb_typings.d.ts" />

/**
 * Order Email Notifications for PocketBase
 * 
 * This file sets up hooks to send email notifications when orders are created or updated
 */

// Log all hook activity to help debug email issues
console.log("[ORDER EMAILS] Order email hooks loaded");

// Function to send an order confirmation email
function sendOrderConfirmationEmail(order, user) {
    console.log(`[ORDER EMAILS] Attempting to send email for order #${order.id} to user ${user.email}`);
    
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
        console.error("[ORDER EMAILS] Error parsing products:", e);
        orderSummary = "Error generating product list. Please check your order online.";
    }

    // Create the email content
    const subject = `Your Konipai Order #${order.id} is Confirmed!`;
    
    // Build a better product list as HTML table
    let productsHtml = '';
    try {
        const products = JSON.parse(order.products);
        productsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #f4f4f4;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        products.forEach(item => {
            productsHtml += `
                <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">
                        <strong>${item.name}</strong>
                        ${item.color ? `<br><span style="color: #777;">Color: ${item.color}</span>` : ''}
                    </td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${formatCurrency(item.price)}</td>
                </tr>
            `;
        });
        
        productsHtml += `
            </tbody>
        </table>
        `;
    } catch (e) {
        console.error("[ORDER EMAILS] Error parsing products for HTML:", e);
        productsHtml = `<p style="color: #d32f2f; padding: 15px; background-color: #ffebee; border-radius: 4px;">
            Error generating product list. Please check your order details online.
        </p>`;
    }
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #219898; padding: 20px; text-align: center;">
                    <img src="https://konipai.in/assets/logo.png" alt="Konipai Logo" style="max-width: 150px;">
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <h1 style="color: #219898; margin-top: 0;">Your Order is Confirmed!</h1>
                    
                    <p style="font-size: 16px;">Hello ${user.name},</p>
                    
                    <p>Thank you for your order! We're pleased to confirm that we've received your order and it's currently being processed.</p>
                    
                    <!-- Order Info Box -->
                    <div style="background-color: #f5f5f5; border-left: 4px solid #219898; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h2 style="margin-top: 0; color: #219898; font-size: 18px;">Order Information</h2>
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                                <td style="padding: 5px 0;">#${order.id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;"><strong>Order Date:</strong></td>
                                <td style="padding: 5px 0;">${new Date(order.created).toLocaleDateString('en-IN', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;"><strong>Order Status:</strong></td>
                                <td style="padding: 5px 0;">
                                    <span style="display: inline-block; background-color: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 12px; font-size: 14px;">
                                        ${order.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;"><strong>Payment Status:</strong></td>
                                <td style="padding: 5px 0;">
                                    <span style="display: inline-block; background-color: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 12px; font-size: 14px;">
                                        ${order.payment_status || 'Processing'}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Order Items -->
                    <h2 style="color: #219898; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary (${totalItems} items)</h2>
                    
                    ${productsHtml}
                    
                    <!-- Order Totals -->
                    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
                            <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Shipping:</strong></td>
                            <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.shipping_fee || 0)}</td>
                        </tr>
                        <tr style="font-size: 18px; font-weight: bold;">
                            <td style="padding: 12px 0; border-top: 2px solid #eee;"><strong>Total:</strong></td>
                            <td style="padding: 12px 0; text-align: right; border-top: 2px solid #eee; color: #219898;">
                                ${formatCurrency(order.totalAmount + (order.shipping_fee || 0))}
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Shipping Address -->
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #219898; font-size: 16px;">Shipping Address</h3>
                        <p style="margin-bottom: 0;">${order.shipping_address || 'Address information not available'}</p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://konipai.in/orders/${order.id}" style="background-color: #219898; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                            View Order Details
                        </a>
                    </div>
                    
                    <p>If you have any questions about your order, please contact our customer service at:</p>
                    <p>
                        Email: <a href="mailto:konipaishop@gmail.com" style="color: #219898; text-decoration: none;">konipaishop@gmail.com</a><br>
                        Phone: +91 9363020252
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #777; font-size: 14px; border-top: 1px solid #eee;">
                    <p style="margin-top: 0;">Thank you for shopping with Konipai!</p>
                    <p style="margin-bottom: 0;">&copy; ${new Date().getFullYear()} Konipai. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Send the email using PocketBase's email sending functionality
    try {
        console.log("[ORDER EMAILS] Attempting to send email with newMailClient()");
        const result = $app.newMailClient().send(
            "konipaishop@gmail.com", // from address - use the configured Gmail address
            user.email, // to address
            subject,
            htmlContent
        );
        console.log(`[ORDER EMAILS] ✓ Email sent successfully to ${user.email} for order #${order.id}`);
        return true;
    } catch (error) {
        console.error(`[ORDER EMAILS] ✗ Failed to send order confirmation email:`, error);
        
        // Try alternative method if the first one fails
        try {
            console.log("[ORDER EMAILS] Attempting to send email with alternative method...");
            $app.newMailClient()
                .setFrom("konipaishop@gmail.com")
                .setTo(user.email)
                .setSubject(subject)
                .setHtml(htmlContent)
                .send(true); // set to true for asynchronous sending
            console.log(`[ORDER EMAILS] ✓ Email sent successfully using alternative method to ${user.email}`);
            return true;
        } catch (altError) {
            console.error(`[ORDER EMAILS] ✗ Alternative method also failed:`, altError);
            return false;
        }
    }
}

// Hook for when an order is created
onRecordAfterCreateRequest("orders", (e) => {
    console.log("[ORDER EMAILS] onRecordAfterCreateRequest hook triggered for order:", e.record.id);
    try {
        // Get the created order record
        const order = e.record;
        
        // Fetch the user information
        console.log("[ORDER EMAILS] Fetching user information for user ID:", order.user);
        const userRecord = $app.dao().findRecordById("users", order.user);
        
        if (!userRecord) {
            console.error("[ORDER EMAILS] User not found for order:", order.id);
            return;
        }
        
        console.log(`[ORDER EMAILS] User found: ${userRecord.email}`);
        
        // Send confirmation email
        const emailSent = sendOrderConfirmationEmail(order, userRecord);
        console.log(`[ORDER EMAILS] Email sending completed with result: ${emailSent}`);
    } catch (error) {
        console.error("[ORDER EMAILS] Error in onRecordAfterCreateRequest hook:", error);
    }
});

// Hook for when an order status is updated (for shipping notifications, etc.)
onRecordAfterUpdateRequest("orders", (e) => {
    console.log("[ORDER EMAILS] onRecordAfterUpdateRequest hook triggered for order:", e.record.id);
    try {
        const record = e.record;
        const oldRecord = e.oldRecord;
        
        // Only send notification if status has changed
        if (record.status !== oldRecord.status) {
            console.log(`[ORDER EMAILS] Order status changed from ${oldRecord.status} to ${record.status}`);
            
            // Get the user information
            const userRecord = $app.dao().findRecordById("users", record.user);
            
            if (!userRecord) {
                console.error("[ORDER EMAILS] User not found for order:", record.id);
                return;
            }
            
            console.log(`[ORDER EMAILS] Found user ${userRecord.email} for status update notification`);
            
            // If the status changed to "shipped", let's send a shipping notification
            if (record.status === "shipped") {
                // TODO: Implement shipping notification email
                console.log(`[ORDER EMAILS] Order ${record.id} has been shipped - notification should be sent to user`);
            }
            
            // For all status changes, you could also resend a modified order confirmation
            // with status update highlighted
            sendOrderConfirmationEmail(record, userRecord);
        }
    } catch (error) {
        console.error("[ORDER EMAILS] Error in onRecordAfterUpdateRequest hook:", error);
    }
}); 
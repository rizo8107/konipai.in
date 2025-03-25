/**
 * SMTP Email Sender for Konipai Order Confirmations
 * 
 * This module provides direct SMTP email functionality for sending order confirmations
 * and other transactional emails directly from PocketBase.
 */

// SMTP Configuration - Define with default fallbacks
const SMTP_CONFIG = {
    host: $os.getenv('SMTP_HOST') || 'smtp.hostinger.com',
    port: parseInt($os.getenv('SMTP_PORT') || '465'),
    secure: $os.getenv('SMTP_SECURE') !== 'false', // true for 465, false for other ports
    auth: {
        user: $os.getenv('SMTP_USER') || 'contact@konipai.in',
        pass: $os.getenv('SMTP_PASSWORD') || ''
    }
};

// Email Templates
const EMAIL_TEMPLATES = {
    orderConfirmation: {
        subject: 'Your Konipai Order Confirmation - #{{orderId}}',
        fromName: 'Konipai',
        fromEmail: 'contact@konipai.in',
        replyTo: 'contact@konipai.in'
    },
    orderStatusUpdate: {
        subject: 'Your Konipai Order Status Update - #{{orderId}}',
        fromName: 'Konipai',
        fromEmail: 'contact@konipai.in',
        replyTo: 'contact@konipai.in'
    }
};

/**
 * Generate HTML order confirmation email
 */
function generateOrderConfirmationHTML(orderData) {
    const {
        orderId,
        customerInfo,
        products,
        formattedAddress,
        financialDetails,
        orderDate
    } = orderData;

    const productRows = products.map(product => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${product.imageUrl}" width="50" height="50" style="object-fit: cover;" />
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${product.name} ${product.color ? `- ${product.color}` : ''}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                ${product.quantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                ${formatCurrency(product.price)}
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-summary { margin-top: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 10px; background-color: #f5f5f5; }
            .total-row { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="https://konipai.in/assets/logo.png" alt="Konipai" width="150">
            <h1>Order Confirmation</h1>
        </div>
        
        <div class="content">
            <p>Dear ${customerInfo.name},</p>
            
            <p>Thank you for your order! We're pleased to confirm that we have received your order.</p>
            
            <div class="order-info">
                <p><strong>Order Number:</strong> #${orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString('en-IN')}</p>
            </div>
            
            <div class="shipping-info">
                <h3>Shipping Address:</h3>
                <p>${formattedAddress}</p>
            </div>
            
            <div class="order-summary">
                <h3>Order Summary:</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 60px;"></th>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
                            <td style="padding: 10px; text-align: right;">${financialDetails.subtotalFormatted}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;">Shipping:</td>
                            <td style="padding: 10px; text-align: right;">${financialDetails.shippingCostFormatted}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="padding: 10px; text-align: right;">Total:</td>
                            <td style="padding: 10px; text-align: right;">${financialDetails.totalFormatted}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="next-steps">
                <h3>What's Next?</h3>
                <p>You will receive another email when your order has been shipped. You can also check your order status by visiting <a href="https://konipai.in/orders/${orderId}">your account</a>.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>If you have any questions, reply to this email or contact us at contact@konipai.in</p>
            <p>&copy; ${new Date().getFullYear()} Konipai. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
}

/**
 * Format currency as INR
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
 * Send an email using SMTP
 */
async function sendEmail(to, subject, html, options = {}) {
    try {
        console.log('Sending email to:', to);
        console.log('With subject:', subject);
        
        // PocketBase doesn't use require, we need to use the built-in $mail API
        const result = await $mails.sendMail({
            from: `${options.fromName || EMAIL_TEMPLATES.orderConfirmation.fromName} <${options.fromEmail || EMAIL_TEMPLATES.orderConfirmation.fromEmail}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: html,
            text: options.text || '',
            headers: {
                'Reply-To': options.replyTo || EMAIL_TEMPLATES.orderConfirmation.replyTo
            }
        });
        
        console.log(`Email sent successfully`);
        return { success: true };
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(orderData) {
    try {
        if (!orderData || !orderData.customerInfo || !orderData.customerInfo.email) {
            console.error('Invalid order data: Missing customer email');
            return { success: false, error: 'Missing customer email' };
        }
        
        const subject = EMAIL_TEMPLATES.orderConfirmation.subject.replace('{{orderId}}', orderData.orderId);
        const html = generateOrderConfirmationHTML(orderData);
        
        return await sendEmail(
            orderData.customerInfo.email,
            subject,
            html
        );
    } catch (error) {
        console.error(`Error sending order confirmation: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send order status update email
 */
async function sendOrderStatusEmail(orderData) {
    // Similar to confirmation email but with status update content
    return await sendOrderConfirmationEmail(orderData); // For now, using the same email format
}

// Export for PocketBase hook system
module.exports = {
    sendEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail
};

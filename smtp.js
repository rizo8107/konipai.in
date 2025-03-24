/**
 * SMTP Module for sending order emails
 * 
 * This module provides functionality to send order confirmation emails
 * via SMTP using the nodemailer library in PocketBase hooks.
 */

const nodemailer = require('nodemailer');

// SMTP configuration
const smtpConfig = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'support@konipai.in',
    pass: 'Bharu@2399',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Generate the HTML for a product image with proper URL construction
 */
function generateProductImageHtml(product, baseUrl) {
  try {
    // Ensure we have a product with valid ID
    if (!product || !product.id) return '';
    
    // Check if we have images
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      return `<img src="${baseUrl}/placeholder-product.svg" alt="${product.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"/>`;
    }
    
    // Get the first image - exactly matching OrderConfirmation.tsx implementation
    const imageUrl = `${baseUrl?.replace(/\/$/, '') || 'https://pocketbase.konipai.in'}/api/files/pbc_4092854851/${product.id}/${product.images[0].split('/').pop()}`;
    
    return `<img src="${imageUrl}" alt="${product.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"/>`;
  } catch (error) {
    console.error(`Error generating image HTML: ${error.message}`);
    return '';
  }
}

/**
 * Generate HTML for order emails
 */
function generateOrderEmailHtml(order, baseUrl) {
  try {
    // Parse the order data
    const products = parseOrderProducts(order);
    const { text: productSummary, count: itemCount } = generateOrderSummary(products);
    
    // Get shipping address if available
    let shippingAddress = parseShippingAddress(order);
    
    // Generate product rows HTML
    let productsHtml = '';
    for (const item of products) {
      try {
        const productImageHtml = generateProductImageHtml(item.product, baseUrl);
        productsHtml += `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="60">${productImageHtml}</td>
                <td style="padding-left: 10px;">
                  <div style="font-weight: bold;">${item.product.name}</div>
                  <div style="color: #666; font-size: 14px;">Quantity: ${item.quantity}</div>
                  <div>u20b9${item.product.price.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        `;
      } catch (err) {
        console.error(`Error generating product row: ${err.message}`);
      }
    }
    
    // Build the email HTML
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .order-header { background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-summary { margin-bottom: 20px; }
        .footer { font-size: 12px; color: #777; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="${baseUrl}/images/konipai-logo.png" alt="Konipai" style="max-width: 150px;">
        </div>
        
        <div class="order-header">
          <h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
          <p>Thank you for your order, ${order.customer_name || 'Valued Customer'}!</p>
          <p style="margin: 5px 0;">Order #: <strong>${order.id}</strong></p>
          <p style="margin: 5px 0;">Date: <strong>${new Date().toLocaleDateString()}</strong></p>
        </div>
        
        <div class="order-summary">
          <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${productsHtml}
            <tr>
              <td style="padding: 15px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: right;">Subtotal:</td>
                    <td style="text-align: right; width: 80px;">u20b9${order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right;">Shipping:</td>
                    <td style="text-align: right;">u20b9${order.shipping_cost ? order.shipping_cost.toFixed(2) : '0.00'}</td>
                  </tr>
                  ${order.couponCode ? `
                  <tr>
                    <td style="text-align: right;">Discount (${order.couponCode}):</td>
                    <td style="text-align: right;">-u20b9${order.discountAmount ? order.discountAmount.toFixed(2) : '0.00'}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                    <td style="text-align: right; font-weight: bold; font-size: 16px;">u20b9${order.total ? order.total.toFixed(2) : '0.00'}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <div class="shipping-info">
          <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Shipping Information</h2>
          <p>${shippingAddress.formatted || 'No shipping address provided'}</p>
        </div>
        
        <div class="order-status">
          <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Status</h2>
          <p>Your order has been received and is now being processed. You will receive another email once your order has been shipped.</p>
          <p>Payment Status: <strong>${getPaymentStatusMessage(order.payment_status)}</strong></p>
        </div>
        
        <div class="footer">
          <p>If you have any questions or concerns, please contact our customer service team.</p>
          <p>&copy; ${new Date().getFullYear()} Konipai. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    return emailHtml;
  } catch (error) {
    console.error(`Error generating order email HTML: ${error.message}`);
    return `<p>There was an error generating your order email. Please contact support with order ID ${order.id}.</p>`;
  }
}

/**
 * Send an order confirmation email
 */
async function sendOrderConfirmationEmail(orderData, userEmail, userName) {
  try {
    // Determine the base URL for images and links
    const baseUrl = process.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || 'https://pocketbase.konipai.in';
    console.log(`Using base URL for images: ${baseUrl}`);
    
    // Generate email HTML
    const htmlContent = generateOrderEmailHtml(orderData, baseUrl);
    
    // Send the email
    const info = await transporter.sendMail({
      from: '"Konipai Support" <support@konipai.in>',
      to: userEmail,
      subject: `Order Confirmation #${orderData.id}`,
      html: htmlContent,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send an order status update email
 */
async function sendOrderStatusEmail(orderData, userEmail, userName, newStatus) {
  try {
    // Get status display text
    const statusText = {
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }[newStatus] || 'Updated';
    
    // Determine the base URL for images and links
    const baseUrl = process.env.PUBLIC_URL || 'https://konipai.in';
    
    // Generate email HTML
    const htmlContent = generateOrderEmailHtml(orderData, baseUrl);
    
    // Send the email
    const info = await transporter.sendMail({
      from: '"Konipai Support" <support@konipai.in>',
      to: userEmail,
      subject: `Order ${statusText}: #${orderData.id}`,
      html: htmlContent,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail
};

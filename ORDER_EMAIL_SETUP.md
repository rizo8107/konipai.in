# Konipai Order Email Notification System

This document explains how to set up and use the order email notification system for Konipai's e-commerce application.

## Overview

The order email notification system automatically sends emails to customers when:
1. They place a new order (order confirmation)
2. Their order status changes (shipping notifications, etc.)

The system uses **n8n workflows** for email generation and delivery, receiving order data from PocketBase hooks via webhooks.

## Files in the System

- `pb_hooks/order-emails.pb.js` - PocketBase hook that sends order data to n8n webhooks when orders are created or updated
- `scripts/test-webhook.ts` - Script to test the webhook connection to n8n

## Setup Instructions

### 1. Configure n8n Workflows

The n8n workflow system handles email notifications. The following workflows should be configured:

#### Order Confirmation Workflow
- **Trigger**: Webhook receiving order data from PocketBase
- **Action**: Send email to customer with order details
- **Webhook URL**: `https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7`

### 2. Email Provider Recommendations

For production use, configure n8n to connect to one of these email providers:

- **Gmail**: Requires an "App Password" (not your regular password)
- **SendGrid**: Provides high deliverability and analytics
- **Amazon SES**: Good for high-volume sending
- **Mailgun**: Offers a free tier with good deliverability

### 3. Testing the Email System

To test the email system:
1. Run the test webhook script: `npx tsx scripts/test-webhook.ts`
2. Check if the workflow is triggered in n8n
3. Place a test order through your application
4. Check n8n execution logs for any issues

## Email Templates in n8n

Create the following email templates in n8n:

### Order Confirmation Email

Sent immediately after an order is placed. Includes:
- Order number and date
- Order status and payment status
- Complete list of purchased items with quantities, colors, and prices
- Shipping address information
- Total amount paid
- Links to view order details

### Order Status Update Emails

Different emails for different status changes:
- Order processing notification
- Order shipped notification
- Order delivered notification
- Order cancellation notification
- Payment status change notification

## Dynamic Data in Email Templates

The PocketBase webhook sends the following data that can be used in email templates:

```json
{
  "eventType": "created|updated|status_changed_to_X|payment_status_changed_to_Y",
  "notificationType": "order_created|order_updated|order_status_changed_to_X",
  "timestamp": "ISO timestamp",
  "orderId": "order ID",
  "orderDate": "creation date",
  "updatedDate": "last update date",
  
  "customerInfo": {
    "name": "customer name",
    "email": "customer email",
    "phone": "customer phone"
  },
  
  "shippingAddress": { /* address object */ },
  "formattedAddress": "formatted address string",
  
  "paymentInfo": {
    "paymentId": "payment ID",
    "paymentOrderId": "payment order ID",
    "paymentStatus": "payment status"
  },
  
  "orderStatus": "status",
  
  "products": [
    {
      "productId": "product ID",
      "name": "product name",
      "quantity": 1,
      "price": 9900,
      "color": "color",
      "imageUrl": "image URL"
    }
  ],
  
  "totalItems": 1,
  "orderSummary": "formatted product list",
  
  "financialDetails": {
    "subtotal": 9900,
    "shippingCost": 0,
    "total": 9900,
    "subtotalFormatted": "₹99.00",
    "shippingCostFormatted": "₹0.00",
    "totalFormatted": "₹99.00"
  },
  
  "emailTemplateData": {
    "siteName": "Konipai",
    "siteUrl": "https://konipai.in",
    "logoUrl": "https://konipai.in/assets/logo.png",
    "year": 2025,
    "viewOrderUrl": "https://konipai.in/orders/123",
    "supportEmail": "contact@konipai.in",
    "supportPhone": "+91 9363020252"
  }
}
```

## Troubleshooting

If emails are not being sent:

1. **Check n8n Execution Logs**: Look for errors in the workflow execution
2. **Verify Webhook Connection**: Run the test webhook script to verify communication
3. **Check Spam Folder**: Sometimes order emails may be flagged as spam
4. **Network Issues**: Ensure your PocketBase server can connect to the n8n server
5. **Authentication**: Verify the Basic authentication credentials are correct

## Technical Details

The system uses:
1. PocketBase hooks to detect order events
2. Webhook requests to send data to n8n
3. n8n workflows to process the data and send emails
4. Basic authentication to secure the webhook endpoint

## Security Considerations

- Webhook endpoint is protected with Basic authentication
- SSL encryption for all data transmission
- Email templates should not include sensitive payment details

## Support

For assistance with the email notification system, contact the development team at dev@konipai.in. 
# PocketBase Orders Schema Guide

This guide provides instructions for setting up and configuring the PocketBase schema to support the Orders functionality with Razorpay integration in your Konipai e-commerce application.

## Schema Overview

The orders system consists of the following collections:

1. **orders** - Stores order information including products, payment status, and shipping details
2. **razorpay_orders** - Tracks Razorpay payment information
3. **addresses** - Stores shipping addresses for orders

## Collection Schemas

### 1. Orders Collection

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| user | Relation (users) | Yes | Reference to the user who placed the order |
| products | JSON | Yes | JSON string containing product details |
| subtotal | Number | Yes | Order subtotal before shipping |
| total | Number | Yes | Total order amount including shipping |
| shipping_cost | Number | Yes | Shipping cost |
| status | Select | Yes | Order status (pending, processing, shipped, delivered, cancelled) |
| shipping_address | Relation (addresses) | Yes | Reference to the shipping address |
| customer_name | Text | Yes | Customer's full name |
| customer_email | Text | Yes | Customer's email address |
| customer_phone | Text | Yes | Customer's phone number |
| payment_status | Select | Yes | Payment status (pending, paid, failed, refunded) |
| payment_id | Text | No | Razorpay payment ID |
| payment_order_id | Text | No | Razorpay order ID |

### 2. Razorpay Orders Collection

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| order_id | Text | Yes | Razorpay order ID |
| user_id | Text | Yes | User ID associated with the order |
| amount | Number | Yes | Order amount in smallest currency unit (paise) |
| currency | Text | Yes | Currency code (e.g., INR) |
| receipt | Text | Yes | Receipt reference (usually your internal order ID) |
| status | Text | Yes | Order status from Razorpay |
| payment_status | Select | Yes | Payment status (pending, paid, failed, refunded) |
| payment_id | Text | No | Razorpay payment ID after payment |
| signature | Text | No | Razorpay signature for verification |

### 3. Addresses Collection

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| user | Relation (users) | Yes | Reference to the user who owns this address |
| street | Text | Yes | Street address |
| city | Text | Yes | City |
| state | Text | Yes | State/Province |
| postalCode | Text | Yes | Postal/ZIP code |
| country | Text | Yes | Country |
| phone | Text | No | Contact phone for this address |
| isDefault | Boolean | Yes | Whether this is the user's default address |

## Step-by-Step Setup Guide

### 1. Access PocketBase Admin UI

1. Start your PocketBase server
2. Navigate to `http://127.0.0.1:8090/_/` in your browser (or your custom PocketBase URL)
3. Log in with your admin credentials

### 2. Create the Collections

#### Orders Collection

1. Go to Collections and click "New Collection"
2. Enter name: `orders`
3. Add the following fields:
   - **user**: Type: Relation, Collection: users
   - **products**: Type: JSON
   - **subtotal**: Type: Number, Min: 0
   - **total**: Type: Number, Min: 0
   - **shipping_cost**: Type: Number, Min: 0
   - **status**: Type: Select, Options: pending, processing, shipped, delivered, cancelled
   - **shipping_address**: Type: Relation, Collection: addresses
   - **customer_name**: Type: Text
   - **customer_email**: Type: Text, Format: email
   - **customer_phone**: Type: Text
   - **payment_status**: Type: Select, Options: pending, paid, failed, refunded
   - **payment_id**: Type: Text, Required: No
   - **payment_order_id**: Type: Text, Required: No
4. Set appropriate indexes for faster queries:
   - Add index on `user` field
   - Add index on `customer_email` field
   - Add index on `payment_id` field

#### Razorpay Orders Collection

1. Go to Collections and click "New Collection"
2. Enter name: `razorpay_orders`
3. Add the following fields:
   - **order_id**: Type: Text
   - **user_id**: Type: Text
   - **amount**: Type: Number
   - **currency**: Type: Text
   - **receipt**: Type: Text
   - **status**: Type: Text
   - **payment_status**: Type: Select, Options: pending, paid, failed, refunded
   - **payment_id**: Type: Text, Required: No
   - **signature**: Type: Text, Required: No
4. Set appropriate indexes:
   - Add index on `order_id` field
   - Add index on `user_id` field
   - Add index on `payment_id` field

#### Addresses Collection (if not already created)

1. Go to Collections and click "New Collection"
2. Enter name: `addresses`
3. Add the following fields:
   - **user**: Type: Relation, Collection: users
   - **street**: Type: Text
   - **city**: Type: Text
   - **state**: Type: Text
   - **postalCode**: Type: Text
   - **country**: Type: Text
   - **phone**: Type: Text, Required: No
   - **isDefault**: Type: Boolean
4. Set appropriate indexes:
   - Add index on `user` field

### 3. Configure Collection Permissions

#### Orders Collection

1. Go to the `orders` collection settings
2. Set the following permissions:
   - **View**: Authenticated users can view their own records (Rule: `user.id = @request.auth.id`)
   - **Create**: Authenticated users can create records (Rule: `user.id = @request.auth.id`)
   - **Update**: Only API/Admin can update (for order status updates)
   - **Delete**: Only API/Admin can delete

#### Razorpay Orders Collection

1. Go to the `razorpay_orders` collection settings
2. Set the following permissions:
   - **View**: Authenticated users can view their own records (Rule: `user_id = @request.auth.id`)
   - **Create**: Only API/Admin can create
   - **Update**: Only API/Admin can update
   - **Delete**: Only API/Admin can delete

#### Addresses Collection

1. Go to the `addresses` collection settings
2. Set the following permissions:
   - **View**: Authenticated users can view their own records (Rule: `user.id = @request.auth.id`)
   - **Create**: Authenticated users can create records (Rule: `user.id = @request.auth.id`)
   - **Update**: Authenticated users can update their own records (Rule: `user.id = @request.auth.id`)
   - **Delete**: Authenticated users can delete their own records (Rule: `user.id = @request.auth.id`)

### 4. Install PocketBase Hooks

To handle Razorpay webhooks and payment verification, you need to add the following hooks to your PocketBase server:

1. Copy the `razorpay.pb.js` file to your PocketBase `pb_hooks` directory
2. Restart your PocketBase server to apply the hooks

### 5. Environment Variables

Ensure your PocketBase server has the following environment variables set:

```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

And your frontend application should have:

```bash
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Testing the Integration

1. Start your PocketBase server and frontend application
2. Create a user account and add products to the cart
3. Proceed to checkout and complete the payment process
4. Verify that the order is created in the `orders` collection
5. Check that the payment information is recorded in the `razorpay_orders` collection

## Troubleshooting

### Common Issues

1. **Payment verification fails**: Check that your Razorpay API keys are correctly set in the environment variables
2. **Orders not showing in the user's account**: Verify that the `customer_email` field matches the user's email
3. **Address not linked to order**: Ensure the address is created before the order and the relation is correctly set

### Debugging

1. Check the PocketBase logs for any errors
2. Verify the webhook responses in the Razorpay dashboard
3. Test the payment flow in Razorpay test mode

## Advanced Configuration

### Webhook Setup for Production

For production environments, set up webhooks in your Razorpay dashboard:

1. Go to Dashboard > Settings > Webhooks
2. Add a new webhook with the URL: `https://your-pocketbase-url.com/api/razorpay/webhook`
3. Select the events: payment.authorized, payment.failed, order.paid
4. Set a secret key for webhook verification

### Custom Email Notifications

You can extend the PocketBase hooks to send email notifications when order status changes:

1. Add an email service integration to your PocketBase hooks
2. Trigger emails on order creation and status updates
3. Include order details and tracking information in the emails

## Conclusion

This guide provides a comprehensive setup for integrating Razorpay payments with your PocketBase-powered e-commerce application. By following these steps, you'll have a fully functional orders system with payment processing capabilities.

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize PocketBase client
const pb = new PocketBase(
  process.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host'
);

// Webhook URL to send the order data to
const WEBHOOK_URL = 'https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7';

// Interface for order product
interface OrderProduct {
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
    category?: string;
  };
  quantity: number;
  color?: string;
  price: number;
}

// Interface for order with expanded product details
interface Order {
  id: string;
  user: string;
  products: string | OrderProduct[]; // May be stored as JSON string
  subtotal: number;
  total: number;
  shipping_cost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  payment_order_id?: string;
  created: string;
  updated: string;
  expand?: {
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
    }
  }
}

// Function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount / 100); // Convert paisa to rupees
};

/**
 * Fetch product details for each product in the order
 */
async function fetchProductDetails(orderProducts: OrderProduct[]): Promise<OrderProduct[]> {
  const productsWithDetails = await Promise.all(
    orderProducts.map(async (item) => {
      try {
        // Skip if productId is missing or undefined
        if (!item.productId) {
          console.warn(`Skipping item with missing productId`);
          return {
            ...item,
            product: {
              id: 'unknown',
              name: 'Unknown Product',
              price: item.price || 0,
              images: []
            }
          };
        }

        // Fetch product details
        const product = await pb.collection('products').getOne(item.productId);
        
        // Get full image URLs
        const images = Array.isArray(product.images) 
          ? product.images.map((image: string) => {
              const baseUrl = process.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host';
              return `${baseUrl}/api/files/products/${product.id}/${image}`;
            })
          : [];

        return {
          ...item,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            images,
            description: product.description,
            category: product.category
          }
        };
      } catch (error) {
        console.error(`Error fetching product details for ${item.productId}:`, error);
        // Return item with placeholder product information
        return {
          ...item,
          product: {
            id: item.productId || 'error',
            name: 'Product Information Unavailable',
            price: item.price || 0,
            images: []
          }
        };
      }
    })
  );

  return productsWithDetails;
}

/**
 * Fetch all orders and send them to the webhook
 */
async function sendOrdersToWebhook() {
  try {
    console.log('Fetching orders...');
    
    // Authenticate with the provided credentials
    try {
      await pb.collection('users').authWithPassword(
        'nirmal@lifedemy.in',
        'Life@123'
      );
      console.log('✅ Successfully authenticated as user');
    } catch (authError) {
      console.error('Authentication error:', authError);
      throw new Error('Failed to authenticate. Please check credentials.');
    }

    // Fetch the latest 50 orders
    const orders = await pb.collection('orders').getList(1, 50, {
      sort: '-created',
      expand: 'shippingAddress'
    });
    
    console.log(`Found ${orders.items.length} orders to process`);

    // Process each order
    for (const orderData of orders.items) {
      try {
        const order = orderData as unknown as Order;
        console.log(`Processing order ${order.id}...`);

        // Parse products if they are stored as a string
        let orderProducts: OrderProduct[] = [];
        try {
          orderProducts = typeof order.products === 'string' 
            ? JSON.parse(order.products) 
            : order.products as OrderProduct[];
        } catch (e) {
          console.error('Error parsing products:', e);
          orderProducts = [];
        }

        // Fetch product details for each product
        const productsWithDetails = await fetchProductDetails(orderProducts);

        // Prepare the order data for the webhook
        const orderForWebhook = {
          orderId: order.id,
          orderDate: order.created,
          updatedDate: order.updated,
          customerInfo: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          },
          shippingAddress: order.expand?.shippingAddress || {},
          paymentInfo: {
            paymentId: order.payment_id,
            paymentOrderId: order.payment_order_id,
            paymentStatus: order.payment_status
          },
          orderStatus: order.status,
          products: productsWithDetails,
          financialDetails: {
            subtotal: order.subtotal,
            shippingCost: order.shipping_cost,
            total: order.total,
            subtotalFormatted: formatCurrency(order.subtotal),
            shippingCostFormatted: formatCurrency(order.shipping_cost),
            totalFormatted: formatCurrency(order.total)
          }
        };

        // Send the data to the webhook
        console.log(`Sending order ${order.id} to webhook...`);
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderForWebhook),
        });

        if (response.ok) {
          console.log(`✅ Successfully sent order ${order.id} to webhook`);
        } else {
          console.error(`❌ Failed to send order ${order.id} to webhook: ${response.statusText}`);
          console.error(await response.text());
        }
      } catch (error) {
        console.error(`Error processing order ${orderData.id}:`, error);
      }
    }

    console.log('All orders have been processed');
  } catch (error) {
    console.error('Error sending orders to webhook:', error);
  }
}

// Execute the webhook sender
sendOrdersToWebhook()
  .then(() => console.log('Webhook sending process complete'))
  .catch(error => console.error('Fatal error:', error))
  .finally(() => process.exit(0)); 
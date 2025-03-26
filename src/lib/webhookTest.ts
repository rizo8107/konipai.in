import { pocketbase } from './pocketbase';

// N8N webhook configuration
const N8N_WEBHOOK_URL = "https://backend-n8n.7za6uc.easypanel.host/webhook/e09ff5b4-57f4-4549-91ea-18f9cee355c7";
const N8N_AUTH_USERNAME = "nirmal@lifedemy.in";
const N8N_AUTH_PASSWORD = "Life@123";

// Type definitions for shipping address
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  [key: string]: string; // Allow additional properties
}

// Type definitions for webhook data
interface WebhookOrderData {
  eventType: string;
  notificationType: string;
  timestamp: string;
  orderId: string;
  orderDate: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddress;
  formattedAddress: string;
  paymentInfo: {
    paymentId: string;
    paymentOrderId: string;
    paymentStatus: string;
  };
  orderStatus: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    color: string;
    imageUrl: string;
  }>;
  totalItems: number;
  orderSummary: string;
  financialDetails: {
    subtotal: number;
    shippingCost: number;
    total: number;
    subtotalFormatted: string;
    shippingCostFormatted: string;
    totalFormatted: string;
  };
  emailTemplateData: {
    siteName: string;
    siteUrl: string;
    logoUrl: string;
    year: number;
    viewOrderUrl: string;
    supportEmail: string;
    supportPhone: string;
  };
}

// Type for custom webhook data input
interface CustomWebhookData {
  eventType?: string;
  notificationType?: string;
  timestamp?: string;
  orderId?: string;
  customerInfo?: Partial<WebhookOrderData['customerInfo']>;
  shippingAddress?: Partial<ShippingAddress>;
  paymentInfo?: Partial<WebhookOrderData['paymentInfo']>;
  products?: Partial<WebhookOrderData['products']>[]; 
  [key: string]: unknown;
}

/**
 * Helper function to send data to the webhook
 */
async function sendToWebhook(data: WebhookOrderData) {
  console.log('Sending to webhook at:', N8N_WEBHOOK_URL);
  
  try {
    const credentialsBase64 = btoa(`${N8N_AUTH_USERNAME}:${N8N_AUTH_PASSWORD}`);
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + credentialsBase64
      },
      body: JSON.stringify(data),
    });

    console.log('Webhook response status:', response.status);

    if (!response.ok) {
      // Try to read the response text for more details
      try {
        const responseText = await response.text();
        console.error(`Webhook request failed with status ${response.status}:`, responseText);
        return { success: false, error: responseText, status: response.status };
      } catch (textError) {
        console.error(`Webhook request failed with status ${response.status} and could not read response:`, textError);
        return { success: false, error: 'Could not read error response', status: response.status };
      }
    }

    // Try to read the response for debugging
    try {
      const responseData = await response.json();
      console.log('Webhook response data:', responseData);
      return { success: true, data: responseData };
    } catch (jsonError) {
      console.log('Webhook response is not JSON, but request was successful');
      try {
        const textResponse = await response.text();
        return { success: true, data: textResponse };
      } catch (e) {
        return { success: true, data: 'Response received but not readable' };
      }
    }
  } catch (error) {
    console.error('Error sending to webhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test function to send sample order data to the webhook
 */
export async function testWebhookWithSampleData() {
  console.log('Testing webhook with sample data...');
  try {
    // Create sample order data
    const sampleOrderData: WebhookOrderData = {
      eventType: "test_event",
      notificationType: "webhook_test",
      timestamp: new Date().toISOString(),
      orderId: `test-order-${Date.now()}`,
      orderDate: new Date().toISOString(),
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+919876543210'
      },
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        country: 'India'
      },
      formattedAddress: '123 Test Street, Test City, Test State, 123456, India',
      paymentInfo: {
        paymentId: `pay-test-${Date.now()}`,
        paymentOrderId: `order-test-${Date.now()}`,
        paymentStatus: 'test'
      },
      orderStatus: 'test',
      products: [
        {
          productId: 'test-product-1',
          name: 'Test Product 1',
          quantity: 2,
          price: 1000,
          color: 'Red',
          imageUrl: 'https://konipai.in/assets/test-product-1.jpg'
        },
        {
          productId: 'test-product-2',
          name: 'Test Product 2',
          quantity: 1,
          price: 1500,
          color: 'Blue',
          imageUrl: 'https://konipai.in/assets/test-product-2.jpg'
        }
      ],
      totalItems: 3,
      orderSummary: '- 2x Test Product 1 (₹1,000.00) - Color: Red\n- 1x Test Product 2 (₹1,500.00) - Color: Blue',
      financialDetails: {
        subtotal: 3500,
        shippingCost: 0,
        total: 3500,
        subtotalFormatted: '₹3,500.00',
        shippingCostFormatted: '₹0.00',
        totalFormatted: '₹3,500.00'
      },
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: "https://konipai.in",
        logoUrl: "https://konipai.in/assets/logo.png",
        year: new Date().getFullYear(),
        viewOrderUrl: "https://konipai.in/orders/test-order",
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      }
    };

    console.log('Sample order data prepared:', JSON.stringify(sampleOrderData, null, 2));
    
    // Send the data directly to the webhook
    return await sendToWebhook(sampleOrderData);
  } catch (error) {
    console.error('Error during webhook test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a real order data object manually
 * @param orderId Order ID to use in the object
 */
export async function testWebhookWithRealOrder(orderId: string) {
  console.log(`Testing webhook with real order ID: ${orderId}`);
  try {
    // Create a manually structured order based on the given ID
    const realOrderData: WebhookOrderData = {
      eventType: "payment_success",
      notificationType: "order_payment_success",
      timestamp: new Date().toISOString(),
      orderId: orderId,
      orderDate: new Date().toISOString(),
      customerInfo: {
        name: 'Real Customer',
        email: 'customer@example.com',
        phone: '+919876543210'
      },
      shippingAddress: {
        street: '456 Real Street',
        city: 'Real City',
        state: 'Real State',
        postalCode: '789012',
        country: 'India'
      },
      formattedAddress: '456 Real Street, Real City, Real State, 789012, India',
      paymentInfo: {
        paymentId: `pay-real-${Date.now()}`,
        paymentOrderId: `order-${orderId}`,
        paymentStatus: 'paid'
      },
      orderStatus: 'processing',
      products: [
        {
          productId: 'real-product-1',
          name: 'Real Product 1',
          quantity: 1,
          price: 2000,
          color: 'Green',
          imageUrl: 'https://konipai.in/assets/real-product-1.jpg'
        },
        {
          productId: 'real-product-2',
          name: 'Real Product 2',
          quantity: 3,
          price: 1200,
          color: 'Yellow',
          imageUrl: 'https://konipai.in/assets/real-product-2.jpg'
        }
      ],
      totalItems: 4,
      orderSummary: '- 1x Real Product 1 (₹2,000.00) - Color: Green\n- 3x Real Product 2 (₹1,200.00) - Color: Yellow',
      financialDetails: {
        subtotal: 5600,
        shippingCost: 0,
        total: 5600,
        subtotalFormatted: '₹5,600.00',
        shippingCostFormatted: '₹0.00',
        totalFormatted: '₹5,600.00'
      },
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: "https://konipai.in",
        logoUrl: "https://konipai.in/assets/logo.png",
        year: new Date().getFullYear(),
        viewOrderUrl: `https://konipai.in/orders/${orderId}`,
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      }
    };

    console.log('Real order data prepared:', JSON.stringify(realOrderData, null, 2));
    
    // Send the data directly to the webhook
    return await sendToWebhook(realOrderData);
  } catch (error) {
    console.error('Error during webhook test with real order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test direct webhook call with custom data
 */
export async function testDirectWebhook(customData: CustomWebhookData) {
  console.log('Testing direct webhook with custom data');
  try {
    // Prepare default shipping address if not provided
    const shippingAddress: ShippingAddress = {
      street: customData.shippingAddress?.street || '123 Default Street',
      city: customData.shippingAddress?.city || 'Default City',
      state: customData.shippingAddress?.state || 'Default State',
      postalCode: customData.shippingAddress?.postalCode || '000000',
      country: customData.shippingAddress?.country || 'India',
      ...customData.shippingAddress
    };

    // Create formatted address
    const formattedAddress = [
      shippingAddress.street,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postalCode,
      shippingAddress.country
    ].filter(Boolean).join(', ');

    // Validate and structure the custom data
    const webhookData: WebhookOrderData = {
      eventType: customData.eventType || "custom_event",
      notificationType: customData.notificationType || "custom_notification",
      timestamp: customData.timestamp || new Date().toISOString(),
      orderId: customData.orderId || `custom-order-${Date.now()}`,
      orderDate: customData.timestamp || new Date().toISOString(),
      
      customerInfo: {
        name: customData.customerInfo?.name || 'Custom Customer',
        email: customData.customerInfo?.email || 'custom@example.com',
        phone: customData.customerInfo?.phone || '+919876543210',
      },
      
      shippingAddress,
      formattedAddress,
      
      paymentInfo: {
        paymentId: customData.paymentInfo?.paymentId || `pay-custom-${Date.now()}`,
        paymentOrderId: customData.paymentInfo?.paymentOrderId || `order-custom-${Date.now()}`,
        paymentStatus: customData.paymentInfo?.paymentStatus || 'custom',
      },
      
      orderStatus: customData.orderStatus as string || 'custom',
      
      products: customData.products?.map(product => ({
        productId: product.productId || `product-${Date.now()}`,
        name: product.name || 'Custom Product',
        quantity: product.quantity || 1,
        price: product.price || 1000,
        color: product.color || 'Custom',
        imageUrl: product.imageUrl || 'https://konipai.in/assets/custom-product.jpg',
      })) || [{
        productId: 'custom-product',
        name: 'Default Custom Product',
        quantity: 1,
        price: 1000,
        color: 'Default',
        imageUrl: 'https://konipai.in/assets/custom-product.jpg',
      }],
      
      totalItems: customData.totalItems as number || 1,
      orderSummary: customData.orderSummary as string || '- 1x Default Custom Product (₹1,000.00)',
      
      financialDetails: {
        subtotal: customData.financialDetails?.subtotal || 1000,
        shippingCost: customData.financialDetails?.shippingCost || 0,
        total: customData.financialDetails?.total || 1000,
        subtotalFormatted: customData.financialDetails?.subtotalFormatted || '₹1,000.00',
        shippingCostFormatted: customData.financialDetails?.shippingCostFormatted || '₹0.00',
        totalFormatted: customData.financialDetails?.totalFormatted || '₹1,000.00',
      },
      
      emailTemplateData: {
        siteName: "Konipai",
        siteUrl: "https://konipai.in",
        logoUrl: "https://konipai.in/assets/logo.png",
        year: new Date().getFullYear(),
        viewOrderUrl: `https://konipai.in/orders/${customData.orderId || 'custom'}`,
        supportEmail: "contact@konipai.in",
        supportPhone: "+91 9363020252"
      }
    };

    console.log('Custom webhook data prepared:', JSON.stringify(webhookData, null, 2));
    
    // Send the data directly to the webhook
    return await sendToWebhook(webhookData);
  } catch (error) {
    console.error('Error during direct webhook test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 
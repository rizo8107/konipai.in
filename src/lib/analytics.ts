// Google Tag Manager analytics helper functions

// Define types for analytics events
interface AnalyticsEvent {
  event: string;
  [key: string]: unknown;
}

interface ProductItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
  item_category?: string;
  item_brand?: string;
  discount?: number;
  coupon?: string;
  affiliation?: string;
}

// Enhanced Ecommerce specific interfaces
interface EcommerceItem extends ProductItem {
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
}

interface ConversionEvent {
  transaction_id: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: ProductItem[];
  affiliation?: string;
  conversion_type?: string;
  revenue?: number;
}

// Initialize dataLayer if not already defined
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Helper function to push events to the dataLayer
export const pushToDataLayer = (data: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
    console.log('Data pushed to dataLayer:', data);
  } else {
    console.warn('DataLayer not available');
  }
};

// Helper function to clear ecommerce object before pushing new ecommerce data
// This is a best practice to avoid data persistence issues
const clearEcommerceObject = (): void => {
  pushToDataLayer({
    event: null,
    ecommerce: null
  });
};

// User engagement and flow tracking
export const trackPageView = (pageTitle: string, pagePath: string): void => {
  pushToDataLayer({
    event: 'page_view',
    page_title: pageTitle,
    page_path: pagePath,
    timestamp: new Date().toISOString()
  });
};

export const trackUserLogin = (userId: string, method: string): void => {
  pushToDataLayer({
    event: 'login',
    user_id: userId,
    method: method,
    timestamp: new Date().toISOString()
  });
};

export const trackUserSignup = (userId: string, method: string): void => {
  pushToDataLayer({
    event: 'sign_up',
    user_id: userId,
    method: method,
    timestamp: new Date().toISOString()
  });
};

// Enhanced E-commerce tracking functions
export const trackProductImpression = (
  items: EcommerceItem[],
  listName: string = 'Product List'
): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'view_item_list',
    ecommerce: {
      items: items.map((item, index) => ({
        ...item,
        item_list_name: listName,
        item_list_id: `list-${listName.toLowerCase().replace(/\s+/g, '-')}`,
        index: index + 1,
      }))
    },
    timestamp: new Date().toISOString()
  });
};

export const trackProductView = (product: ProductItem): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: 'INR',
      value: product.price,
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddToCart = (product: ProductItem): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'INR',
      value: product.price * product.quantity,
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackRemoveFromCart = (product: ProductItem): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: {
      currency: 'INR',
      value: product.price * product.quantity,
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackCartView = (products: ProductItem[], value: number): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'view_cart',
    ecommerce: {
      currency: 'INR',
      value: value,
      items: products
    },
    timestamp: new Date().toISOString()
  });
};

export const trackBeginCheckout = (products: ProductItem[], value: number, coupon?: string): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'INR',
      value: value,
      coupon: coupon,
      items: products
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddShippingInfo = (
  products: ProductItem[], 
  value: number, 
  shippingTier: string,
  coupon?: string
): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'add_shipping_info',
    ecommerce: {
      currency: 'INR',
      value: value,
      shipping_tier: shippingTier,
      coupon: coupon,
      items: products
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddPaymentInfo = (
  products: ProductItem[], 
  value: number, 
  paymentType: string,
  coupon?: string
): void => {
  clearEcommerceObject();
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'INR',
      value: value,
      payment_type: paymentType,
      coupon: coupon,
      items: products
    },
    timestamp: new Date().toISOString()
  });
};

// Core conversion tracking function
export const trackPurchase = (
  products: ProductItem[], 
  transactionId: string, 
  value: number, 
  shipping: number = 0, 
  tax: number = 0,
  coupon?: string,
  affiliation: string = 'Konipai Web Store'
): void => {
  clearEcommerceObject();
  
  // Calculate actual revenue (value minus tax and shipping)
  const revenue = value - tax - shipping;
  
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      affiliation: affiliation,
      value: value,
      tax: tax,
      shipping: shipping,
      currency: 'INR',
      coupon: coupon,
      revenue: revenue, // This helps with accurate revenue tracking
      items: products
    },
    conversion_value: value,
    timestamp: new Date().toISOString()
  });
  
  // Also track for Google Ads conversion tracking
  pushToDataLayer({
    event: 'conversion',
    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
    transaction_id: transactionId,
    value: value,
    currency: 'INR'
  });
};

// Dynamic conversion value tracking
export const trackDynamicConversion = (conversionData: ConversionEvent): void => {
  clearEcommerceObject();
  
  // Extract revenue if not explicitly provided (value minus tax and shipping)
  const revenue = conversionData.revenue || 
    (conversionData.value - (conversionData.tax || 0) - (conversionData.shipping || 0));
  
  // Create the base ecommerce object
  const ecommerceData = {
    transaction_id: conversionData.transaction_id,
    affiliation: conversionData.affiliation || 'Konipai Web Store',
    value: conversionData.value,
    tax: conversionData.tax,
    shipping: conversionData.shipping,
    currency: conversionData.currency || 'INR',
    coupon: conversionData.coupon,
    revenue: revenue,
    items: conversionData.items
  };
  
  // Push the main purchase event
  pushToDataLayer({
    event: 'purchase',
    ecommerce: ecommerceData,
    conversion_value: conversionData.value,
    conversion_type: conversionData.conversion_type || 'Sale',
    timestamp: new Date().toISOString()
  });
  
  // Also track for Google Ads conversion tracking with dynamic send_to based on conversion type
  const conversionMapping: Record<string, string> = {
    'Sale': 'AW-CONVERSION_ID/SALE_LABEL',
    'Lead': 'AW-CONVERSION_ID/LEAD_LABEL',
    'Signup': 'AW-CONVERSION_ID/SIGNUP_LABEL',
    'AddToCart': 'AW-CONVERSION_ID/ADD_TO_CART_LABEL'
  };
  
  const sendTo = conversionMapping[conversionData.conversion_type || 'Sale'] || 'AW-CONVERSION_ID/SALE_LABEL';
  
  pushToDataLayer({
    event: 'conversion',
    send_to: sendTo,
    transaction_id: conversionData.transaction_id,
    value: conversionData.value,
    currency: conversionData.currency || 'INR'
  });
};

// Monetization tracking
export const trackMonetizationStart = (contentId: string, contentType: string, price: number): void => {
  pushToDataLayer({
    event: 'monetization_start',
    content_id: contentId,
    content_type: contentType,
    price: price,
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
};

export const trackMonetizationComplete = (contentId: string, contentType: string, price: number): void => {
  pushToDataLayer({
    event: 'monetization_complete',
    content_id: contentId,
    content_type: contentType,
    price: price,
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
};

export const trackSubscriptionStart = (
  subscriptionId: string, 
  plan: string, 
  price: number, 
  billing: 'monthly' | 'yearly'
): void => {
  pushToDataLayer({
    event: 'subscription_start',
    subscription_id: subscriptionId,
    plan: plan,
    price: price,
    billing_cycle: billing,
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
};

export const trackSubscriptionRenew = (
  subscriptionId: string, 
  plan: string, 
  price: number, 
  billing: 'monthly' | 'yearly'
): void => {
  pushToDataLayer({
    event: 'subscription_renew',
    subscription_id: subscriptionId,
    plan: plan,
    price: price,
    billing_cycle: billing,
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
};

export const trackSubscriptionCancel = (
  subscriptionId: string, 
  plan: string, 
  reason?: string
): void => {
  pushToDataLayer({
    event: 'subscription_cancel',
    subscription_id: subscriptionId,
    plan: plan,
    cancel_reason: reason,
    timestamp: new Date().toISOString()
  });
};

// Button click tracking
export const trackButtonClick = (buttonName: string, buttonText: string, pagePath: string): void => {
  pushToDataLayer({
    event: 'button_click',
    button_name: buttonName,
    button_text: buttonText,
    page_path: pagePath,
    timestamp: new Date().toISOString()
  });
};

// Form interaction tracking
export const trackFormStart = (formName: string, formId: string): void => {
  pushToDataLayer({
    event: 'form_start',
    form_name: formName,
    form_id: formId,
    timestamp: new Date().toISOString()
  });
};

export const trackFormCompletion = (formName: string, formId: string): void => {
  pushToDataLayer({
    event: 'form_complete',
    form_name: formName,
    form_id: formId,
    timestamp: new Date().toISOString()
  });
};

export const trackFormError = (formName: string, formId: string, errorMessage: string): void => {
  pushToDataLayer({
    event: 'form_error',
    form_name: formName,
    form_id: formId,
    error_message: errorMessage,
    timestamp: new Date().toISOString()
  });
};

// Payment flow tracking
export const trackPaymentStart = (orderId: string, amount: number, paymentMethod: string): void => {
  pushToDataLayer({
    event: 'payment_start',
    order_id: orderId,
    value: amount,
    currency: 'INR',
    payment_method: paymentMethod,
    timestamp: new Date().toISOString()
  });
};

export const trackPaymentSuccess = (
  orderId: string, 
  transactionId: string, 
  amount: number, 
  paymentMethod: string
): void => {
  pushToDataLayer({
    event: 'payment_success',
    order_id: orderId,
    transaction_id: transactionId,
    value: amount,
    currency: 'INR',
    payment_method: paymentMethod,
    timestamp: new Date().toISOString()
  });
};

export const trackPaymentFailure = (
  orderId: string, 
  amount: number, 
  paymentMethod: string, 
  errorMessage: string
): void => {
  pushToDataLayer({
    event: 'payment_failure',
    order_id: orderId,
    value: amount,
    currency: 'INR',
    payment_method: paymentMethod,
    error_message: errorMessage,
    timestamp: new Date().toISOString()
  });
};

// Define the window interface with dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
} 
// Google Tag Manager analytics helper functions
import { getUtmParamsForAnalytics } from './utm';

// Import Facebook CAPI functions
import { trackPurchaseConversion, trackAddToCartConversion, trackLeadConversion } from './capi';

// Import Facebook Pixel tracking
import {
  trackPixelEvent,
  trackPurchase as trackPixelPurchase,
  trackAddToCart as trackPixelAddToCart,
  trackViewContent as trackPixelViewContent,
  trackInitiateCheckout as trackPixelInitiateCheckout,
  pixelEvents
} from './pixel';

// Define types for analytics events
interface AnalyticsEvent {
  event: string;
  [key: string]: unknown;
}

export interface ProductItem {
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
    // Add UTM parameters to all events
    const utmParams = getUtmParamsForAnalytics();
    const enrichedData = {
      ...data,
      ...utmParams
    };
    
    window.dataLayer.push(enrichedData);
    console.log('Data pushed to dataLayer:', enrichedData);
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

// Ensure values are safe for analytics
function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  return String(value);
}

// User engagement and flow tracking
export const trackPageView = (pageTitle: string, pagePath: string): void => {
  pushToDataLayer({
    event: 'page_view',
    page_title: sanitizeValue(pageTitle),
    page_path: sanitizeValue(pagePath),
    timestamp: new Date().toISOString()
  });
};

export const trackUserLogin = (userId: string, method: string): void => {
  pushToDataLayer({
    event: 'login',
    user_id: sanitizeValue(userId),
    method: sanitizeValue(method),
    timestamp: new Date().toISOString()
  });
};

export const trackUserSignup = (userId: string, method: string): void => {
  pushToDataLayer({
    event: 'sign_up',
    user_id: sanitizeValue(userId),
    method: sanitizeValue(method),
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
        item_list_name: sanitizeValue(listName),
        item_list_id: `list-${sanitizeValue(listName).toLowerCase().replace(/\s+/g, '-')}`,
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

  // Track in Facebook Pixel
  trackPixelViewContent(
    product.item_id,
    'product',
    product.item_name,
    product.price,
    'INR',
    {
      content_category: product.item_category
    }
  );
};

export const trackAddToCart = async (
  product: ProductItem,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  }
): Promise<void> => {
  clearEcommerceObject();
  
  // Track in Google Analytics
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'INR',
      value: product.price * product.quantity,
      items: [product]
    },
    timestamp: new Date().toISOString()
  });

  // Track in Facebook Pixel
  trackPixelAddToCart(
    product.price * product.quantity,
    'INR', 
    [product.item_id],
    product.item_name,
    {
      content_category: product.item_category,
      quantity: product.quantity
    }
  );

  // Track in Facebook CAPI if user data is available
  if (userData) {
    await trackAddToCartConversion(userData, {
      value: product.price * product.quantity,
      currency: 'INR',
      contentId: product.item_id,
      contentName: product.item_name,
      contentCategory: product.item_category,
      quantity: product.quantity,
      price: product.price
    });
  }
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

export const trackBeginCheckout = (products: ProductItem[], value: number): void => {
  clearEcommerceObject();
  
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'INR',
      value: value,
      items: products
    },
    timestamp: new Date().toISOString()
  });

  // Track in Facebook Pixel
  trackPixelInitiateCheckout(
    value,
    'INR',
    products.map(product => product.item_id),
    products.reduce((sum, product) => sum + product.quantity, 0)
  );
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
      shipping_tier: sanitizeValue(shippingTier),
      coupon: sanitizeValue(coupon),
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
      payment_type: sanitizeValue(paymentType),
      coupon: sanitizeValue(coupon),
      items: products
    },
    timestamp: new Date().toISOString()
  });
};

// Core conversion tracking function
export const trackPurchase = async (
  products: ProductItem[], 
  transactionId: string, 
  value: number, 
  shipping: number = 0, 
  tax: number = 0,
  coupon?: string,
  affiliation: string = 'Konipai Web Store',
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  }
): Promise<void> => {
  clearEcommerceObject();
  
  // Calculate actual revenue (value minus tax and shipping)
  const revenue = value - tax - shipping;
  
  // Track in Google Analytics
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: sanitizeValue(transactionId),
      affiliation: sanitizeValue(affiliation),
      value: value,
      tax: tax,
      shipping: shipping,
      currency: 'INR',
      coupon: sanitizeValue(coupon),
      revenue: revenue,
      items: products
    },
    conversion_value: value,
    timestamp: new Date().toISOString()
  });
  
  // Track in Google Ads
  pushToDataLayer({
    event: 'conversion',
    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
    transaction_id: sanitizeValue(transactionId),
    value: value,
    currency: 'INR'
  });

  // Track in Facebook Pixel
  trackPixelPurchase(
    value,
    'INR',
    products.map(product => product.item_id),
    products.map(product => product.item_name).join(', '),
    products.reduce((sum, product) => sum + product.quantity, 0),
    {
      content_type: 'product',
      transaction_id: sanitizeValue(transactionId),
      tax: tax,
      shipping: shipping,
      coupon: sanitizeValue(coupon)
    }
  );

  // Track in Facebook CAPI if user data is available
  if (userData) {
    await trackPurchaseConversion(userData, {
      value: value,
      currency: 'INR',
      contents: products.map(product => ({
        id: product.item_id,
        quantity: product.quantity,
        price: product.price
      })),
      contentIds: products.map(product => product.item_id),
      contentType: 'product',
      contentName: products.map(product => product.item_name).join(', '),
      contentCategory: products[0]?.item_category
    });
  }
};

// Dynamic conversion value tracking
export const trackDynamicConversion = (conversionData: ConversionEvent): void => {
  clearEcommerceObject();
  
  // Extract revenue if not explicitly provided (value minus tax and shipping)
  const revenue = conversionData.revenue || 
    (conversionData.value - (conversionData.tax || 0) - (conversionData.shipping || 0));
  
  // Create the base ecommerce object
  const ecommerceData = {
    transaction_id: sanitizeValue(conversionData.transaction_id),
    affiliation: sanitizeValue(conversionData.affiliation || 'Konipai Web Store'),
    value: conversionData.value,
    tax: conversionData.tax,
    shipping: conversionData.shipping,
    currency: conversionData.currency || 'INR',
    coupon: sanitizeValue(conversionData.coupon),
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
    transaction_id: sanitizeValue(conversionData.transaction_id),
    value: conversionData.value,
    currency: conversionData.currency || 'INR'
  });
};

// Monetization tracking
export const trackMonetizationStart = (contentId: string, contentType: string, price: number): void => {
  pushToDataLayer({
    event: 'monetization_start',
    content_id: sanitizeValue(contentId),
    content_type: sanitizeValue(contentType),
    price: price,
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
};

export const trackMonetizationComplete = (contentId: string, contentType: string, price: number): void => {
  pushToDataLayer({
    event: 'monetization_complete',
    content_id: sanitizeValue(contentId),
    content_type: sanitizeValue(contentType),
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
    subscription_id: sanitizeValue(subscriptionId),
    plan: sanitizeValue(plan),
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
    subscription_id: sanitizeValue(subscriptionId),
    plan: sanitizeValue(plan),
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
    subscription_id: sanitizeValue(subscriptionId),
    plan: sanitizeValue(plan),
    cancel_reason: sanitizeValue(reason),
    timestamp: new Date().toISOString()
  });
};

// Button click tracking
export const trackButtonClick = (buttonName: string, buttonText: string, pagePath: string): void => {
  pushToDataLayer({
    event: 'button_click',
    button_name: sanitizeValue(buttonName),
    button_text: sanitizeValue(buttonText),
    page_path: sanitizeValue(pagePath),
    timestamp: new Date().toISOString()
  });
};

// Form interaction tracking
export const trackFormStart = (formName: string, formId: string): void => {
  pushToDataLayer({
    event: 'form_start',
    form_name: sanitizeValue(formName),
    form_id: sanitizeValue(formId),
    timestamp: new Date().toISOString()
  });
};

export const trackFormCompletion = async (
  formName: string, 
  formId: string,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  }
): Promise<void> => {
  // Track in Google Analytics
  pushToDataLayer({
    event: 'form_complete',
    form_name: sanitizeValue(formName),
    form_id: sanitizeValue(formId),
    timestamp: new Date().toISOString()
  });

  // Track in Facebook Pixel
  trackPixelEvent(pixelEvents.LEAD, {
    content_name: sanitizeValue(formName),
    content_category: 'form_submission'
  });

  // Track as lead in Facebook CAPI if user data is available
  if (userData) {
    await trackLeadConversion(userData, {
      contentName: sanitizeValue(formName),
      contentCategory: 'form_submission'
    });
  }
};

export const trackFormError = (formName: string, formId: string, errorMessage: string): void => {
  pushToDataLayer({
    event: 'form_error',
    form_name: sanitizeValue(formName),
    form_id: sanitizeValue(formId),
    error_message: sanitizeValue(errorMessage),
    timestamp: new Date().toISOString()
  });
};

// Payment flow tracking
export const trackPaymentStart = (orderId: string, amount: number, paymentMethod: string): void => {
  pushToDataLayer({
    event: 'payment_start',
    order_id: sanitizeValue(orderId),
    value: amount,
    currency: 'INR',
    payment_method: sanitizeValue(paymentMethod),
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
    order_id: sanitizeValue(orderId),
    transaction_id: sanitizeValue(transactionId),
    value: amount,
    currency: 'INR',
    payment_method: sanitizeValue(paymentMethod),
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
    order_id: sanitizeValue(orderId),
    value: amount,
    currency: 'INR',
    payment_method: sanitizeValue(paymentMethod),
    error_message: sanitizeValue(errorMessage),
    timestamp: new Date().toISOString()
  });
};

// Define the window interface with dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
} 
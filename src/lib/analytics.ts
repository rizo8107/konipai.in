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

// E-commerce tracking functions
export const trackProductView = (product: ProductItem): void => {
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddToCart = (product: ProductItem): void => {
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackRemoveFromCart = (product: ProductItem): void => {
  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: {
      items: [product]
    },
    timestamp: new Date().toISOString()
  });
};

export const trackCartView = (products: ProductItem[], value: number): void => {
  pushToDataLayer({
    event: 'view_cart',
    ecommerce: {
      items: products,
      value: value,
      currency: 'INR'
    },
    timestamp: new Date().toISOString()
  });
};

export const trackBeginCheckout = (products: ProductItem[], value: number): void => {
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      items: products,
      value: value,
      currency: 'INR'
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddShippingInfo = (products: ProductItem[], value: number, shippingTier: string): void => {
  pushToDataLayer({
    event: 'add_shipping_info',
    ecommerce: {
      items: products,
      value: value,
      currency: 'INR',
      shipping_tier: shippingTier
    },
    timestamp: new Date().toISOString()
  });
};

export const trackAddPaymentInfo = (products: ProductItem[], value: number, paymentType: string): void => {
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      items: products,
      value: value,
      currency: 'INR',
      payment_type: paymentType
    },
    timestamp: new Date().toISOString()
  });
};

export const trackPurchase = (
  products: ProductItem[], 
  transactionId: string, 
  value: number, 
  shipping: number = 0, 
  tax: number = 0
): void => {
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: value,
      tax: tax,
      shipping: shipping,
      currency: 'INR',
      items: products
    },
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
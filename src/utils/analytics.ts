// Google Analytics utility functions
// This file provides helper functions for tracking page views and events in Google Analytics

// Declare global gtag function to avoid TypeScript errors
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Track a page view in Google Analytics
 * @param path The page path to track
 * @param title The page title 
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }
  
  window.gtag('config', 'G-RMJGBPDQG0', {
    page_path: path,
    page_title: title
  });
};

/**
 * Track an event in Google Analytics
 * @param action The event action
 * @param category The event category
 * @param label Optional event label
 * @param value Optional event value
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};

/**
 * Track ecommerce events
 * @param eventType The type of ecommerce event (view_item, add_to_cart, begin_checkout, purchase, etc.)
 * @param products Array of product data
 * @param currency Currency code (default: INR)
 * @param value Total value of the transaction
 */
export const trackEcommerceEvent = (
  eventType: 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'purchase',
  products: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    item_category?: string;
    item_variant?: string;
  }>,
  currency: string = 'INR',
  value?: number
): void => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  // Calculate value if not provided
  const calculatedValue = value || products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  window.gtag('event', eventType, {
    currency: currency,
    value: calculatedValue,
    items: products
  });
};

/**
 * Track a user login event
 * @param method Login method used (e.g., 'Email', 'Google', etc.)
 */
export const trackLogin = (method: string): void => {
  trackEvent('login', 'User', method);
  window.gtag('event', 'login', {
    method: method
  });
};

/**
 * Track a user signup event
 * @param method Signup method used (e.g., 'Email', 'Google', etc.)
 */
export const trackSignup = (method: string): void => {
  trackEvent('sign_up', 'User', method);
  window.gtag('event', 'sign_up', {
    method: method
  });
};

/**
 * Track exceptions/errors
 * @param description Error description
 * @param fatal Whether the error was fatal
 */
export const trackError = (description: string, fatal: boolean = false): void => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('event', 'exception', {
    description: description,
    fatal: fatal
  });
}; 
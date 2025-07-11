/**
 * Facebook Pixel event tracking utility
 */

// Store last event timestamps to prevent duplicate events
const lastEventTimestamps: Record<string, number> = {};
const EVENT_THROTTLE_MS = 2000; // 2 seconds throttle

/**
 * Track a standard event with Facebook Pixel
 * @param eventName The standard Facebook event name
 * @param params Optional parameters for the event
 */
export const trackPixelEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (!window.fbq) return;
  
  // Create a unique key for this event
  const eventKey = `${eventName}_${JSON.stringify(params || {})}`;
  const now = Date.now();
  
  // Check if this exact event was fired recently
  if (lastEventTimestamps[eventKey] && now - lastEventTimestamps[eventKey] < EVENT_THROTTLE_MS) {
    console.log(`Meta Pixel: Skipped duplicate ${eventName} event (throttled)`);
    return;
  }
  
  // Track the event and update timestamp
  window.fbq('track', eventName, params);
  lastEventTimestamps[eventKey] = now;
  console.log(`Meta Pixel: Tracked ${eventName} event`, params);
};

/**
 * Track a custom event with Facebook Pixel
 * @param eventName The custom event name
 * @param params Optional parameters for the event
 */
export const trackPixelCustomEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (window.fbq) {
    window.fbq('trackCustom', eventName, params);
    console.log(`Meta Pixel: Tracked custom ${eventName} event`, params);
  }
};

// Standard Facebook Pixel events
export const pixelEvents = {
  // Conversion events
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  ADD_TO_CART: 'AddToCart',
  ADD_TO_WISHLIST: 'AddToWishlist',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  CONTACT: 'Contact',
  CUSTOMIZE_PRODUCT: 'CustomizeProduct',
  DONATE: 'Donate',
  FIND_LOCATION: 'FindLocation',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  LEAD: 'Lead',
  PURCHASE: 'Purchase',
  SCHEDULE: 'Schedule',
  SEARCH: 'Search',
  START_TRIAL: 'StartTrial',
  SUBMIT_APPLICATION: 'SubmitApplication',
  SUBSCRIBE: 'Subscribe',
  VIEW_CONTENT: 'ViewContent',
  
  // Engagement events
  PAGE_VIEW: 'PageView',
  
  // Custom events
  BUTTON_CLICK: 'ButtonClick',
  FORM_SUBMIT: 'FormSubmit',
  FORM_ERROR: 'FormError',
  USER_LOGIN: 'UserLogin',
  USER_SIGNUP: 'UserSignup',
};

/**
 * Track a Page View event
 */
export const trackPageView = (): void => {
  trackPixelEvent(pixelEvents.PAGE_VIEW);
};

/**
 * Track a Purchase event
 * @param value The monetary value of the purchase
 * @param currency The currency code (default: INR)
 * @param contentIds Array of product IDs in the purchase
 * @param contentName Name of the purchased content
 * @param numItems Number of items purchased
 * @param additionalParams Additional parameters to include
 */
export const trackPurchase = (
  value: number,
  currency: string = 'INR',
  contentIds?: string[],
  contentName?: string,
  numItems?: number,
  additionalParams?: Record<string, unknown>
): void => {
  trackPixelEvent(pixelEvents.PURCHASE, {
    value,
    currency,
    content_ids: contentIds,
    content_name: contentName,
    num_items: numItems,
    ...additionalParams,
  });
};

/**
 * Track an Add to Cart event
 * @param value The monetary value of the item
 * @param currency The currency code (default: INR)
 * @param contentIds Array of product IDs added to cart
 * @param contentName Name of the content added to cart
 * @param additionalParams Additional parameters to include
 */
export const trackAddToCart = (
  value: number,
  currency: string = 'INR',
  contentIds?: string[],
  contentName?: string,
  additionalParams?: Record<string, unknown>
): void => {
  trackPixelEvent(pixelEvents.ADD_TO_CART, {
    value,
    currency,
    content_ids: contentIds,
    content_name: contentName,
    ...additionalParams,
  });
};

/**
 * Track a View Content event
 * @param contentId ID of the viewed content
 * @param contentType Type of the content (e.g., 'product')
 * @param contentName Name of the viewed content
 * @param value Optional monetary value of the content
 * @param currency The currency code (default: INR)
 * @param additionalParams Additional parameters to include
 */
export const trackViewContent = (
  contentId: string,
  contentType: string = 'product',
  contentName?: string,
  value?: number,
  currency: string = 'INR',
  additionalParams?: Record<string, unknown>
): void => {
  trackPixelEvent(pixelEvents.VIEW_CONTENT, {
    content_id: contentId,
    content_type: contentType,
    content_name: contentName,
    value,
    currency,
    ...additionalParams,
  });
};

/**
 * Track an Initiate Checkout event
 * @param value The monetary value of the checkout
 * @param currency The currency code (default: INR)
 * @param contentIds Array of product IDs in the checkout
 * @param numItems Number of items in the checkout
 * @param additionalParams Additional parameters to include
 */
export const trackInitiateCheckout = (
  value: number,
  currency: string = 'INR',
  contentIds?: string[],
  numItems?: number,
  additionalParams?: Record<string, unknown>
): void => {
  trackPixelEvent(pixelEvents.INITIATE_CHECKOUT, {
    value,
    currency,
    content_ids: contentIds,
    num_items: numItems,
    ...additionalParams,
  });
};

/**
 * Track a Complete Registration event
 * @param value Optional monetary value of the registration
 * @param currency The currency code (default: INR)
 * @param contentName Name of the registration (e.g., 'Account Creation')
 * @param additionalParams Additional parameters to include
 */
export const trackCompleteRegistration = (
  value?: number,
  currency: string = 'INR',
  contentName: string = 'Account Creation',
  additionalParams?: Record<string, unknown>
): void => {
  trackPixelEvent(pixelEvents.COMPLETE_REGISTRATION, {
    value,
    currency,
    content_name: contentName,
    ...additionalParams,
  });
};

export default {
  trackPixelEvent,
  trackPixelCustomEvent,
  trackPageView,
  trackPurchase,
  trackAddToCart,
  trackViewContent,
  trackInitiateCheckout,
  trackCompleteRegistration,
  pixelEvents,
}; 
import { getUtmParamsForAnalytics } from './utm';

const CAPI_VERSION = 'v17.0';
const PIXEL_ID = '504160516081802'; // Meta Pixel ID
const ACCESS_TOKEN = 'EAAS7f3ZCpw5UBO9iFeBY1t34n4zElc2IL5T9ZCcPpiWG83p6ZC4jJBekPYZA5w9qLpwUhGju8t5zZBog9h0ZBj2KUtQjyZBmGd5yZBJld36sCkDUz5msSIxOhtvZBmDV4FxJFkYDNzuf1WboMA7YVSZCAd6Dxg0kv1lZAQC6m94s9V4ddlJ2NhH6qiIivi1TQ3bZC4ZCpyAZDZD';
const API_ENDPOINT = `https://graph.facebook.com/${CAPI_VERSION}/${PIXEL_ID}/events`;

// Throttling and deduplication for CAPI events
const CAPI_THROTTLE_MS = 3000; // 3 seconds throttle
const lastEventTimestamps: Record<string, number> = {};
const sentEvents: Set<string> = new Set();

// Clean up sent events periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  // Remove events older than 10 minutes
  for (const [key, timestamp] of Object.entries(lastEventTimestamps)) {
    if (now - timestamp > 600000) { // 10 minutes
      delete lastEventTimestamps[key];
    }
  }
  // Clear sent events set if it gets too large
  if (sentEvents.size > 1000) {
    sentEvents.clear();
  }
}, 300000); // Clean up every 5 minutes

interface UserData {
  em?: string[]; // Hashed email addresses
  ph?: string[]; // Hashed phone numbers
  fn?: string[]; // Hashed first names
  ln?: string[]; // Hashed last names
  ct?: string[]; // Hashed cities
  st?: string[]; // Hashed states
  zp?: string[]; // Hashed zip codes
  country?: string[]; // Hashed countries
  external_id?: string[]; // Hashed external IDs
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    price?: number;
  }>;
  num_items?: number;
  status?: string;
  delivery_category?: string;
}

interface ServerEvent {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'mobile_app' | 'chat' | 'email' | 'other';
  event_source_url?: string;
  user_data: UserData;
  custom_data?: CustomData;
}

/**
 * Hash a string using SHA-256
 */
const hashData = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Prepare user data by hashing all PII fields
 */
const prepareUserData = async (data: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
}): Promise<UserData> => {
  const userData: UserData = {};

  if (data.email) {
    userData.em = [await hashData(data.email)];
  }
  if (data.phone) {
    userData.ph = [await hashData(data.phone)];
  }
  if (data.firstName) {
    userData.fn = [await hashData(data.firstName)];
  }
  if (data.lastName) {
    userData.ln = [await hashData(data.lastName)];
  }
  if (data.city) {
    userData.ct = [await hashData(data.city)];
  }
  if (data.state) {
    userData.st = [await hashData(data.state)];
  }
  if (data.zipCode) {
    userData.zp = [await hashData(data.zipCode)];
  }
  if (data.country) {
    userData.country = [await hashData(data.country)];
  }
  if (data.externalId) {
    userData.external_id = [await hashData(data.externalId)];
  }

  return userData;
};

/**
 * Send event to Facebook Conversions API
 */
export const sendConversionEvent = async (
  eventName: string,
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  },
  customData?: CustomData
): Promise<void> => {
  try {
    // Create a unique event key for throttling and deduplication
    const eventKey = `${eventName}-${userData.email || ''}-${userData.phone || ''}-${customData?.value || ''}`;
    
    // Check if this event was recently sent
    const now = Date.now();
    const lastSent = lastEventTimestamps[eventKey] || 0;
    
    if (now - lastSent < CAPI_THROTTLE_MS) {
      console.log(`CAPI event throttled (sent ${now - lastSent}ms ago):`, eventName);
      return;
    }
    
    // Check for duplicate events
    if (sentEvents.has(eventKey)) {
      console.log(`CAPI duplicate event skipped:`, eventName);
      return;
    }
    
    // Update timestamps and mark as sent
    lastEventTimestamps[eventKey] = now;
    sentEvents.add(eventKey);
    
    const hashedUserData = await prepareUserData(userData);
    
    const event: ServerEvent = {
      event_name: eventName,
      event_time: Math.floor(now / 1000),
      action_source: 'website',
      event_source_url: window.location.href,
      user_data: hashedUserData,
      custom_data: customData
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [event],
        access_token: ACCESS_TOKEN,
      }),
    });

    if (!response.ok) {
      throw new Error(`CAPI request failed: ${response.statusText}`);
    }

    console.log('CAPI event sent successfully:', eventName);
  } catch (error) {
    console.error('Error sending CAPI event:', error);
  }
};

/**
 * Track a purchase conversion
 */
export const trackPurchaseConversion = async (
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  },
  purchaseData: {
    value: number;
    currency?: string;
    contents: Array<{
      id: string;
      quantity: number;
      price?: number;
    }>;
    contentIds?: string[];
    contentType?: string;
    contentName?: string;
    contentCategory?: string;
  }
) => {
  await sendConversionEvent('Purchase', userData, {
    value: purchaseData.value,
    currency: purchaseData.currency || 'INR',
    contents: purchaseData.contents,
    content_ids: purchaseData.contentIds,
    content_type: purchaseData.contentType || 'product',
    content_name: purchaseData.contentName,
    content_category: purchaseData.contentCategory,
    num_items: purchaseData.contents.reduce((sum, item) => sum + item.quantity, 0)
  });
};

/**
 * Track an add to cart conversion
 */
export const trackAddToCartConversion = async (
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  },
  productData: {
    value: number;
    currency?: string;
    contentId: string;
    contentName?: string;
    contentCategory?: string;
    quantity: number;
    price?: number;
  }
) => {
  await sendConversionEvent('AddToCart', userData, {
    value: productData.value,
    currency: productData.currency || 'INR',
    content_ids: [productData.contentId],
    content_name: productData.contentName,
    content_category: productData.contentCategory,
    contents: [{
      id: productData.contentId,
      quantity: productData.quantity,
      price: productData.price
    }]
  });
};

/**
 * Track a lead conversion
 */
export const trackLeadConversion = async (
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  },
  leadData?: {
    value?: number;
    currency?: string;
    contentCategory?: string;
    contentName?: string;
  }
) => {
  await sendConversionEvent('Lead', userData, {
    value: leadData?.value,
    currency: leadData?.currency || 'INR',
    content_category: leadData?.contentCategory,
    content_name: leadData?.contentName
  });
};

export default {
  sendConversionEvent,
  trackPurchaseConversion,
  trackAddToCartConversion,
  trackLeadConversion
}; 
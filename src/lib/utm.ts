// UTM parameter tracking utility

// Define interface for UTM parameters
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  [key: string]: string | undefined;
}

const UTM_STORAGE_KEY = 'konipai_utm_params';
const UTM_EXPIRY_KEY = 'konipai_utm_expiry';
const UTM_EXPIRY_DAYS = 30; // Store UTM params for 30 days

/**
 * Extract UTM parameters from the current URL
 */
export const extractUtmParams = (): UtmParams => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UtmParams = {};
  
  // Extract all UTM parameters
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param] = value;
    }
  });
  
  return utmParams;
};

/**
 * Save UTM parameters to localStorage with expiry
 */
export const saveUtmParams = (params: UtmParams): void => {
  if (typeof window === 'undefined' || Object.keys(params).length === 0) return;
  
  try {
    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + UTM_EXPIRY_DAYS);
    
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    localStorage.setItem(UTM_EXPIRY_KEY, expiryDate.toISOString());
  } catch (error) {
    console.error('Error saving UTM params to localStorage', error);
  }
};

/**
 * Get saved UTM parameters from localStorage
 */
export const getSavedUtmParams = (): UtmParams => {
  if (typeof window === 'undefined') return {};
  
  try {
    // Check if UTM params have expired
    const expiryDateStr = localStorage.getItem(UTM_EXPIRY_KEY);
    if (expiryDateStr) {
      const expiryDate = new Date(expiryDateStr);
      if (expiryDate < new Date()) {
        // Clear expired UTM params
        localStorage.removeItem(UTM_STORAGE_KEY);
        localStorage.removeItem(UTM_EXPIRY_KEY);
        return {};
      }
    }
    
    const savedParams = localStorage.getItem(UTM_STORAGE_KEY);
    if (savedParams) {
      return JSON.parse(savedParams);
    }
  } catch (error) {
    console.error('Error retrieving UTM params from localStorage', error);
  }
  
  return {};
};

/**
 * Get active UTM parameters - from URL or from storage if not in URL
 */
export const getActiveUtmParams = (): UtmParams => {
  const urlParams = extractUtmParams();
  
  // If URL has UTM params, use and save those
  if (Object.keys(urlParams).length > 0) {
    saveUtmParams(urlParams);
    return urlParams;
  }
  
  // Otherwise return saved params
  return getSavedUtmParams();
};

/**
 * Append UTM parameters to a URL
 */
export const appendUtmParams = (url: string): string => {
  const utmParams = getActiveUtmParams();
  if (!utmParams || Object.keys(utmParams).length === 0) return url;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Append all UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        urlObj.searchParams.set(key, value);
      }
    });
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error appending UTM params to URL', error);
    return url;
  }
};

/**
 * Include UTM parameters in analytics events
 */
export const getUtmParamsForAnalytics = (): Record<string, string> => {
  const utmParams = getActiveUtmParams();
  const result: Record<string, string> = {};
  
  // Rename keys to follow analytics naming conventions
  if (utmParams.utm_source) result.traffic_source = utmParams.utm_source;
  if (utmParams.utm_medium) result.traffic_medium = utmParams.utm_medium;
  if (utmParams.utm_campaign) result.traffic_campaign = utmParams.utm_campaign;
  if (utmParams.utm_term) result.traffic_term = utmParams.utm_term;
  if (utmParams.utm_content) result.traffic_content = utmParams.utm_content;
  
  return result;
}; 
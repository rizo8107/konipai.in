import { UtmParams } from './utm';

/**
 * Generate a URL with UTM parameters for marketing campaigns
 * 
 * @param baseUrl The base URL to append UTM parameters to
 * @param utmParams Object containing UTM parameters
 * @returns URL string with UTM parameters
 */
export const generateUtmUrl = (baseUrl: string, utmParams: UtmParams): string => {
  try {
    // Create URL object to easily manipulate parameters
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    
    // Add each UTM parameter to the URL
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  } catch (error) {
    console.error('Error generating UTM URL', error);
    return baseUrl;
  }
};

/**
 * Utility function to quickly generate common marketing URLs
 * 
 * @param baseUrl Base URL to add parameters to
 * @param source Traffic source (e.g., facebook, google)
 * @param medium Traffic medium (e.g., social, cpc)
 * @param campaign Campaign name (e.g., summer_sale)
 * @param content Content identifier (e.g., banner_1)
 * @param term Search term for paid campaigns
 * @returns URL with UTM parameters
 */
export const createMarketingUrl = (
  baseUrl: string,
  source: string,
  medium: string,
  campaign: string,
  content?: string,
  term?: string
): string => {
  const params: UtmParams = {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  };
  
  if (content) params.utm_content = content;
  if (term) params.utm_term = term;
  
  return generateUtmUrl(baseUrl, params);
};

/**
 * Create a social media sharing URL with UTM parameters
 * 
 * @param baseUrl Base URL to share
 * @param platform Social platform (e.g., facebook, twitter)
 * @param campaign Campaign name
 * @param content Content identifier
 * @returns URL with UTM parameters for social sharing
 */
export const createSocialSharingUrl = (
  baseUrl: string,
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'pinterest',
  campaign: string = 'social_share',
  content?: string
): string => {
  return createMarketingUrl(
    baseUrl,
    platform,
    'social',
    campaign,
    content || `${platform}_share`
  );
};

export default generateUtmUrl; 
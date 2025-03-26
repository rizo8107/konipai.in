import { useEffect } from 'react';
import { extractUtmParams, saveUtmParams } from '@/lib/utm';

/**
 * Hook to capture and process UTM parameters on page load
 * This should be used in your root layout or app component
 */
export const useUtmParams = (): void => {
  useEffect(() => {
    // Extract UTM parameters from URL and save them
    const utmParams = extractUtmParams();
    if (Object.keys(utmParams).length > 0) {
      saveUtmParams(utmParams);
    }
  }, []);
};

export default useUtmParams; 
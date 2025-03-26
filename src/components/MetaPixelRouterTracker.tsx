import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component to track page views with Meta Pixel specifically for React Router
 * This component must be used inside a Router context
 */
export function MetaPixelRouterTracker() {
  const location = useLocation();

  // Track page views when the location changes
  useEffect(() => {
    if (window.fbq) {
      console.log('Meta Pixel: Tracked PageView via React Router');
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null;
} 
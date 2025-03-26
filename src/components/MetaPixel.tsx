import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define more specific types for Facebook Pixel
declare global {
  interface Window {
    fbq: (method: string, eventName: string, params?: Record<string, unknown>) => void;
    _fbq: {
      push: (args: unknown) => void;
      loaded: boolean;
      version: string;
      queue: unknown[];
    };
  }
}

export function MetaPixel() {
  const location = useLocation();

  useEffect(() => {
    // Initialize Meta Pixel
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const initFbPixel = Function('f', 'b', 'e', 'v', 'n', 't', 's', `
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    `);
    
    initFbPixel(
      window, 
      document, 
      'script', 
      'https://connect.facebook.net/en_US/fbevents.js', 
      window.fbq, 
      undefined, 
      undefined
    );

    // Initialize pixel
    window.fbq('init', '504160516081802');
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  // Add noscript element
  useEffect(() => {
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = 'https://www.facebook.com/tr?id=504160516081802&ev=PageView&noscript=1';
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      if (document.body.contains(noscript)) {
        document.body.removeChild(noscript);
      }
    };
  }, []);

  return null;
} 
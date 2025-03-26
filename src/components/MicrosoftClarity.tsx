import { useEffect } from 'react';

// Define types for Microsoft Clarity
declare global {
  interface Window {
    clarity: (method: string, ...args: unknown[]) => void;
  }
}

export function MicrosoftClarity() {
  useEffect(() => {
    try {
      // Initialize Microsoft Clarity
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "qu704we4lh");

      // Track initial page view
      if (window.clarity) {
        window.clarity("set", "page_view", {
          url: window.location.href,
          title: document.title
        });
      }

      // Set up a MutationObserver to detect DOM changes (React Router updates)
      let lastPathname = window.location.pathname;
      
      const observer = new MutationObserver(() => {
        const currentPathname = window.location.pathname;
        if (currentPathname !== lastPathname) {
          lastPathname = currentPathname;
          if (window.clarity) {
            window.clarity("set", "page_view", {
              url: window.location.href,
              title: document.title
            });
          }
        }
      });
      
      // Start observing the document body for DOM changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });

      // Clean up
      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.error('Error initializing Microsoft Clarity:', error);
    }
  }, []);

  return null;
} 
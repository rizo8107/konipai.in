import React from 'react';
import { getActiveUtmParams } from '@/lib/utm';

interface UtmExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  preserveUtm?: boolean;
}

/**
 * External link component that can optionally append UTM parameters
 * @param preserveUtm Set to true to append current UTM parameters to external link
 */
export const UtmExternalLink = React.forwardRef<HTMLAnchorElement, UtmExternalLinkProps>(
  ({ href, children, preserveUtm = false, ...rest }, ref) => {
    // Process the href to include UTM parameters if needed
    let processedHref = href;
    
    if (preserveUtm) {
      try {
        const url = new URL(href);
        const utmParams = getActiveUtmParams();
        
        // Add UTM parameters to the URL
        Object.entries(utmParams).forEach(([key, value]) => {
          if (value) {
            url.searchParams.set(key, value);
          }
        });
        
        processedHref = url.toString();
      } catch (error) {
        console.error('Error processing external URL', error);
      }
    }
    
    return (
      <a 
        {...rest} 
        href={processedHref} 
        ref={ref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
);

UtmExternalLink.displayName = 'UtmExternalLink';

export default UtmExternalLink; 
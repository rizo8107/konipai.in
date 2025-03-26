import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { appendUtmParams } from '@/lib/utm';

/**
 * UtmLink component that automatically appends UTM parameters to all internal links
 * Use this instead of Link from react-router-dom to maintain UTM parameter tracking
 */
export const UtmLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => {
    const { to, children, ...rest } = props;
    
    // Process the "to" prop to append UTM parameters
    let processedTo = to;
    
    if (typeof to === 'string') {
      // If "to" is a string, directly append params
      processedTo = appendUtmParams(to);
    } else if (typeof to === 'object' && to !== null) {
      // If "to" is a location object, handle more complex case
      const toObject = { ...to };
      
      // Get the pathname and search
      const pathname = toObject.pathname || '';
      const search = toObject.search || '';
      
      // Combine and process
      const fullPath = `${pathname}${search}`;
      const processedPath = appendUtmParams(fullPath);
      
      // Extract the new search part
      const url = new URL(processedPath, window.location.origin);
      toObject.search = url.search;
      
      processedTo = toObject;
    }
    
    return (
      <Link 
        {...rest} 
        to={processedTo} 
        ref={ref}
      >
        {children}
      </Link>
    );
  }
);

UtmLink.displayName = 'UtmLink';

export default UtmLink; 
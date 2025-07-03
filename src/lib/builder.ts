import { builder } from '@builder.io/react';

// Replace with your Builder.io API key
// You can get this from your Builder.io dashboard under Account Settings > API Keys
export const BUILDER_API_KEY = 'bpk-95be79e29e1741cea04a96e53b5ace10';

// Initialize the Builder SDK with your API key
builder.init(BUILDER_API_KEY);

// Set default options
builder.setUserAttributes({
  // Example: device type
  device: typeof window !== 'undefined' ? 
    window.innerWidth > 768 ? 'desktop' : 'mobile' : 'desktop'
});

// Export for use in components
export { builder };

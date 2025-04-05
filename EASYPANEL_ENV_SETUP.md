# EasyPanel Environment Variables Setup Guide

This guide explains how to set up environment variables in EasyPanel for your Konipai application.

## Setting Up Environment Variables

1. Log in to your EasyPanel dashboard.

2. Navigate to your project (konipai).

3. Go to the "Environment" or "Settings" tab.

4. Add the following environment variables:

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| EASYPANEL_BUILD | true | Enables EasyPanel-specific build optimizations |
| SKIP_IMAGE_OPTIMIZATION | true | Skips memory-intensive image optimization during build |
| VITE_POCKETBASE_URL | https://backend-pocketbase.7za6uc.easypanel.host/ | URL to your PocketBase backend |
| VITE_RAZORPAY_KEY_ID | rzp_live_3rZx2njbNwMEE1 | Your Razorpay live mode API key |
| VITE_RAZORPAY_PROXY_URL | https://konipai-server.7za6uc.easypanel.host | Razorpay proxy URL |
| VITE_RAZORPAY_PROXY_KEY | 5cfd34e6-ef3b-4121-bfce-945d96a178d9 | Razorpay proxy key |
| VITE_SITE_TITLE | Konipai | Your site title |
| VITE_SITE_LOGO | https://konipai.in/assets/logo.png | URL to your site logo |

5. Click "Save" or "Apply Changes".

6. Restart your application to apply the new environment variables.

## Build Configuration

The Konipai application uses a special build configuration for EasyPanel that:

1. Reduces memory usage during build
2. Skips image optimization steps
3. Uses simpler chunking strategies
4. Disables source maps and other development features

This ensures that the application can be built successfully within the resource constraints of EasyPanel containers.

## Troubleshooting

If you encounter build errors:

1. Ensure all environment variables are set correctly
2. Check that the EASYPANEL_BUILD and SKIP_IMAGE_OPTIMIZATION variables are set to "true"
3. Verify that NODE_OPTIONS="--max-old-space-size=2048" is set in the Dockerfile
4. If encountering memory issues, try increasing the memory allocation in the easypanel.json resources section

## Docker Configuration

The Dockerfile is configured to:

1. Use the node:18-alpine image for building
2. Set memory limits appropriately
3. Run the build:easypanel script
4. Use nginx:alpine for serving the static files

## Benefits of Using Environment Variables

- **Security**: Sensitive information like API keys are not hardcoded in your configuration files
- **Flexibility**: You can easily change values without modifying code
- **Environment Isolation**: Different environments (development, staging, production) can have different values

## Additional Information

For more details on configuring EasyPanel, visit the [EasyPanel documentation](https://easypanel.io/docs). 
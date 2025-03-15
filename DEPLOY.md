# Netlify Deployment Guide

This guide explains how to deploy the Konipai Tote Bag Hub to Netlify.

## Prerequisites

- A Netlify account (free tier is sufficient)
- Access to the GitHub repository or the source code
- A running PocketBase instance (self-hosted or cloud-hosted)

## Deployment Steps

### 1. Prepare Your Environment Variables

Make sure your PocketBase instance is running and accessible. You'll need the URL for your environment variables.

Required environment variables:
- `VITE_POCKETBASE_URL`: The URL of your PocketBase instance (e.g., `https://backend-pocketbase.example.com`)

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify UI

1. Log in to your Netlify account
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository or upload your build folder
4. Configure the build settings:
   - Build command: `npm run deploy` (this will run prepare:netlify and build)
   - Publish directory: `dist`
5. Add the required environment variables in the "Environment" section
6. Click "Deploy site"

#### Option B: Deploy via Netlify CLI

1. Install the Netlify CLI globally:
   ```
   npm install -g netlify-cli
   ```

2. Log in to Netlify:
   ```
   netlify login
   ```

3. Deploy the site:
   ```
   npm run build
   netlify deploy --prod
   ```

4. Configure environment variables:
   ```
   netlify env:set VITE_POCKETBASE_URL https://your-pocketbase-url.com
   ```

### 3. Configure PocketBase for Production

Make sure your PocketBase instance is properly configured for production:

1. Set up proper authentication and security rules
2. Enable CORS for your Netlify domain:
   - Go to your PocketBase admin panel → Settings → API
   - Add your Netlify domain to the CORS allowed origins (e.g., `https://your-site.netlify.app`)

### 4. Test Your Deployment

After deployment, verify that:
1. The site loads correctly
2. User authentication works
3. Products can be browsed and added to cart
4. Orders can be placed
5. User profiles can be updated

## Troubleshooting

### Common Issues

1. **API Connection Issues**: If the frontend can't connect to PocketBase, verify:
   - The environment variable is correctly set
   - CORS is configured properly on PocketBase
   - Your PocketBase instance is publicly accessible

2. **Routing Issues**: If you see 404 errors when refreshing or accessing direct URLs:
   - Verify the `_redirects` file is in your build folder
   - Check that the Netlify redirects are correctly configured

3. **Build Errors**: If the build fails:
   - Check your build logs in the Netlify dashboard
   - Verify that all dependencies are correctly installed

For additional help, refer to the [Netlify Documentation](https://docs.netlify.com/) or [PocketBase Documentation](https://pocketbase.io/docs/). 
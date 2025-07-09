# Google Maps Integration Setup Guide

This document explains how to properly set up and configure the Google Maps API for address autocomplete functionality in the Konipai application.

## Overview

The Konipai checkout process uses Google Maps Places API for address autocomplete functionality. This allows customers to easily enter their shipping address by typing and selecting from Google's suggestions.

## Required API Key

To use the Google Maps functionality, you need a valid Google Maps API key with the following APIs enabled:
- Places API
- Maps JavaScript API
- Geocoding API

## Configuration Steps

### 1. Create a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "API Key"
5. Restrict the API key to only the APIs mentioned above
6. Set HTTP referrer restrictions to your domain(s)

### 2. Add the API Key to Environment Variables

The API key should be added as an environment variable named `VITE_GOOGLE_MAPS_API_KEY`.

#### For Local Development:
Add to your `.env` file:
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### For Docker Deployment:
Add the build argument when building the Docker image:
```
--build-arg VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### For Easypanel Deployment:
Add the environment variable in the Easypanel project settings:
1. Go to your Easypanel dashboard
2. Select the Konipai project
3. Go to "Settings" > "Environment Variables"
4. Add `VITE_GOOGLE_MAPS_API_KEY` with your API key value
5. Rebuild the application

## Troubleshooting

If the address autocomplete is not working:

1. Check the browser console for any errors related to Google Maps
2. Verify that the API key is correctly set in the environment variables
3. Ensure the API key has the necessary APIs enabled
4. Check that the API key has proper restrictions set (domain restrictions)
5. Verify that billing is enabled for the Google Cloud project

## Security Considerations

- Never hardcode the API key directly in the source code
- Always use environment variables for API keys
- Set appropriate restrictions on your API key to prevent unauthorized use
- Monitor your API usage in the Google Cloud Console

## Related Files

- `src/components/AddressAutocomplete.tsx` - The component that uses the Google Maps API
- `Dockerfile` - Contains the environment variable configuration for Docker builds

# EasyPanel Environment Variables Setup Guide

This guide explains how to set up environment variables in EasyPanel for your Konipai application.

## Setting Up Environment Variables

1. Log in to your EasyPanel dashboard.

2. Navigate to your project (konipai-frontend).

3. Go to the "Environment" or "Settings" tab.

4. Add the following environment variables:

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| VITE_POCKETBASE_URL | https://backend-pocketbase.7za6uc.easypanel.host/ | URL to your PocketBase backend |
| VITE_RAZORPAY_KEY_ID | rzp_test_trImBTMCiZgDuF | Your Razorpay test mode API key |
| VITE_SITE_TITLE | Konipai | Your site title |
| VITE_SITE_LOGO | https://konipai.in/assets/logo.png | URL to your site logo |
| GITHUB_PAT | [Your GitHub Personal Access Token] | Token for pulling from GitHub Container Registry |

5. Click "Save" or "Apply Changes".

6. Restart your application to apply the new environment variables.

## Benefits of Using Environment Variables

- **Security**: Sensitive information like API keys are not hardcoded in your configuration files
- **Flexibility**: You can easily change values without modifying code
- **Environment Isolation**: Different environments (development, staging, production) can have different values

## Troubleshooting

If your application is not picking up the environment variables:

1. Make sure the variables are correctly set in EasyPanel
2. Verify that your container is restarted after applying new environment variables
3. Check that your application is correctly reading the environment variables

## Additional Information

For more details on configuring EasyPanel, visit the [EasyPanel documentation](https://easypanel.io/docs). 
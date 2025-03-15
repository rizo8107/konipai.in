#!/usr/bin/env node

/**
 * This script prepares the application for Netlify deployment
 * It validates required environment variables and creates any necessary files
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing application for Netlify deployment...');

// Check for required environment variables
const requiredEnvVars = ['VITE_POCKETBASE_URL'];
const missingEnvVars = requiredEnvVars.filter(
  envVar => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️  Warning: The following environment variables are not set: ${missingEnvVars.join(
      ', '
    )}`
  );
  console.warn('You will need to set these in the Netlify dashboard.');
} else {
  console.log('✅ All required environment variables are set.');
}

// Create _redirects file in the public directory as a backup for netlify.toml
const redirectsContent = `
# Handle SPA routing
/*    /index.html   200

# Add any additional redirects here
`;

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent.trim());
console.log('✅ Created _redirects file in public directory.');

// Create robots.txt if it doesn't exist
const robotsTxtPath = path.join(publicDir, 'robots.txt');
if (!fs.existsSync(robotsTxtPath)) {
  const robotsTxtContent = `
# Allow all crawlers
User-agent: *
Allow: /

# Sitemap location (uncomment and update when you have a sitemap)
# Sitemap: https://yourdomain.com/sitemap.xml
`;
  fs.writeFileSync(robotsTxtPath, robotsTxtContent.trim());
  console.log('✅ Created robots.txt file in public directory.');
}

console.log('🎉 Application is ready for Netlify deployment!');
console.log('Remember to set your environment variables in the Netlify dashboard.'); 
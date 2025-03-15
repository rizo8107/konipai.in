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

try {
  // Create _redirects file in the public directory as a backup for netlify.toml
  const redirectsContent = `
  # Handle SPA routing
  /*    /index.html   200

  # Add any additional redirects here
  `;

  const publicDir = path.resolve(__dirname, '../public');
  console.log(`Creating files in public directory: ${publicDir}`);
  
  if (!fs.existsSync(publicDir)) {
    console.log(`Public directory doesn't exist, creating it...`);
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const redirectsPath = path.join(publicDir, '_redirects');
  fs.writeFileSync(redirectsPath, redirectsContent.trim());
  console.log(`✅ Created _redirects file at: ${redirectsPath}`);

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
    console.log(`✅ Created robots.txt file at: ${robotsTxtPath}`);
  } else {
    console.log(`ℹ️ robots.txt already exists at: ${robotsTxtPath}`);
  }

  console.log('🎉 Application is ready for Netlify deployment!');
  console.log('Remember to set your environment variables in the Netlify dashboard.');
} catch (error) {
  console.error('❌ Error preparing Netlify deployment:', error);
  process.exit(1);
} 
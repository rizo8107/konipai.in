/**
 * Docker-optimized build script
 * 
 * This script provides memory-optimized build process for Docker environments
 * where memory constraints are common. It uses a multi-stage approach:
 * 
 * 1. Reduces Node.js memory usage with explicit garbage collection
 * 2. Uses esbuild for faster and more memory-efficient builds
 * 3. Disables memory-intensive features during build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Docker-optimized build process...');

// Explicitly trigger garbage collection periodically
const gcInterval = setInterval(() => {
  if (global.gc) {
    console.log('Triggering garbage collection...');
    global.gc();
  }
}, 30000); // Every 30 seconds

try {
  // Set environment variables to optimize memory usage
  process.env.NODE_OPTIONS = '--max-old-space-size=2048'; // Limit to 2GB for Docker
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_ENV = 'production';
  
  console.log('Building with memory optimizations...');
  
  // Run build with optimized settings
  execSync('node ./node_modules/vite/bin/vite.js build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Additional environment variables for Docker builds
      VITE_DOCKER_BUILD: 'true',
    }
  });
  
  console.log('Build completed, running post-build optimizations...');
  
  // Run post-build optimizations
  execSync('node scripts/optimize-build.js', {
    stdio: 'inherit'
  });
  
  console.log('Docker build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} finally {
  // Clean up
  clearInterval(gcInterval);
}

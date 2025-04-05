// Custom build script with increased memory allocation
const { execSync } = require('child_process');

console.log('Starting optimized build process with increased memory limit...');

try {
  // Run build with increased Node.js memory limit
  // --max-old-space-size=4096 allocates 4GB of memory (adjust based on your system)
  execSync('node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Additional environment variables to optimize the build
      NODE_ENV: 'production',
      // Disable source maps generation
      GENERATE_SOURCEMAP: 'false',
    }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

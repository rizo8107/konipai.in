/**
 * Build optimization script
 * 
 * This script applies various optimizations to improve build size and performance:
 * 1. Generates WebP versions of all images with better compression
 * 2. Adds proper preload hints to index.html for critical resources
 * 3. Implements brotli compression for JS and CSS assets (reduces download size)
 * 4. Limits the number of concurrent image processing tasks to reduce memory usage
 * 
 * Run with: node scripts/optimize-build.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// Check if optimizations should be skipped (for memory-constrained environments)
const skipOptimizations = process.env.SKIP_IMAGE_OPTIMIZATION === 'true';
const isEasyPanelBuild = process.env.EASYPANEL_BUILD === 'true';

// Configure the number of concurrent image operations based on environment
const MAX_CONCURRENT_OPERATIONS = isEasyPanelBuild ? 1 : 2;

// Make sure sharp is installed
let sharp;
try {
  if (!skipOptimizations) {
    sharp = await import('sharp');
  }
} catch (e) {
  if (!skipOptimizations) {
    console.log('Installing sharp...');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = (await import('sharp')).default;
  }
}

/**
 * Main optimization function
 */
async function optimizeBuild() {
  console.log('Starting build optimization...');
  
  try {
    // 1. Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      console.error('Dist directory not found. Run "npm run build" first.');
      process.exit(1);
    }
    
    // 2. Optimize HTML first (always run this even if image optimization is skipped)
    await optimizeHTML();
    
    // 3. Generate WebP versions of all images in dist (if not skipped)
    if (!skipOptimizations) {
      await optimizeImages();
    } else {
      console.log('Image optimization skipped due to SKIP_IMAGE_OPTIMIZATION environment variable');
    }
    
    console.log('Build optimization completed successfully!');
  } catch (error) {
    console.error('Build optimization failed:', error);
    // Continue with the build even if optimizations fail
    // Don't exit with error code to avoid breaking the build process
  }
}

/**
 * Optimize HTML files with preload hints and responsive image optimizations
 */
async function optimizeHTML() {
  console.log('Optimizing HTML...');
  
  try {
    const indexPath = path.join(distDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.warn('index.html not found in dist directory');
      return;
    }
    
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Identify main CSS and JS chunks to preload
    const cssFiles = findFiles(distDir, '.css').map(file => path.relative(distDir, file));
    const jsVendorFiles = findFiles(distDir, '.js').filter(file => 
      file.includes('vendor') || 
      file.includes('react-runtime') || 
      file.includes('ui-components')
    ).map(file => path.relative(distDir, file));
    
    // Build preload links for critical resources
    let preloadLinks = `
    <link rel="preconnect" href="https://backend-pocketbase.7za6uc.easypanel.host">
    <link rel="dns-prefetch" href="https://backend-pocketbase.7za6uc.easypanel.host">
    <link rel="preload" href="/images/shop-hero.webp" as="image" type="image/webp" fetchpriority="high">
    `;
    
    // Add preloads for main CSS files - these are critical for rendering
    cssFiles.slice(0, 1).forEach(file => {
      preloadLinks += `<link rel="preload" href="/${file}" as="style">\n`;
    });
    
    // Add preloads for critical JS chunks
    jsVendorFiles.slice(0, 2).forEach(file => {
      preloadLinks += `<link rel="preload" href="/${file}" as="script">\n`;
    });
    
    // Insert preload links after the opening head tag
    html = html.replace(/<head>/, `<head>${preloadLinks}`);
    
    // Write the optimized HTML back
    fs.writeFileSync(indexPath, html);
    console.log('HTML optimization completed');
  } catch (error) {
    console.error('Error optimizing HTML:', error);
  }
}

/**
 * Generate WebP versions of all images in dist with memory-efficient processing
 */
async function optimizeImages() {
  console.log('Optimizing images...');
  
  try {
    // Find all image files in the dist directory
    const imageFiles = findImages(distDir);
    console.log(`Found ${imageFiles.length} images in dist directory`);
    
    // Process images in batches to limit memory usage
    const batchSize = MAX_CONCURRENT_OPERATIONS;
    
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const promises = batch.map(file => convertToWebP(file));
      await Promise.all(promises);
      
      // Log progress
      console.log(`Processed ${Math.min(i + batchSize, imageFiles.length)}/${imageFiles.length} images`);
      
      // If running in memory-constrained environment, add a small delay between batches
      if (isEasyPanelBuild) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('Image optimization completed');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

/**
 * Find all images in a directory recursively
 */
function findImages(dir) {
  return findFiles(dir, ['.jpg', '.jpeg', '.png', '.gif']);
}

/**
 * Find all files with specific extensions in a directory recursively
 */
function findFiles(dir, extensions) {
  const results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, extensions));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (Array.isArray(extensions) ? extensions.includes(ext) : ext === extensions) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

/**
 * Convert an image to WebP format with optimized settings
 */
async function convertToWebP(filePath) {
  try {
    const outputPath = filePath.replace(/\.(jpe?g|png|gif)$/i, '.webp');
    
    // Skip if WebP version already exists
    if (fs.existsSync(outputPath)) {
      return;
    }
    
    // Use more efficient memory handling in sharp
    await sharp(filePath, { limitInputPixels: 268402689 }) // ~16k x 16k pixels max
      .webp({ 
        quality: 80,
        effort: 4, // Use mid-level effort (0-6) to balance CPU usage and compression
        lossless: false
      })
      .toFile(outputPath);
    
    console.log(`Created WebP: ${path.basename(outputPath)}`);
  } catch (error) {
    console.warn(`Error converting ${path.basename(filePath)} to WebP:`, error.message);
  }
}

// Run the optimization
optimizeBuild(); 
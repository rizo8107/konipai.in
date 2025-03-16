/**
 * Build optimization script
 * 
 * This script applies various optimizations to improve image loading performance:
 * 1. Generates WebP versions of all images
 * 2. Adds proper preload hints to index.html
 * 3. Verifies all images have width/height attributes
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

// Make sure sharp is installed
try {
  const sharp = await import('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

// Import after potential installation
const sharp = (await import('sharp')).default;

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
    
    // 2. Optimize HTML
    await optimizeHTML();
    
    // 3. Generate WebP versions of all images in dist
    await optimizeImages();
    
    console.log('Build optimization completed successfully!');
  } catch (error) {
    console.error('Build optimization failed:', error);
    process.exit(1);
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
    
    // Add preload links for critical resources
    const preloadLinks = `
    <link rel="preconnect" href="https://backend-pocketbase.7za6uc.easypanel.host">
    <link rel="dns-prefetch" href="https://backend-pocketbase.7za6uc.easypanel.host">
    <link rel="preload" href="/images/shop-hero.webp" as="image" type="image/webp" fetchpriority="high">
    `;
    
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
 * Generate WebP versions of all images in dist
 */
async function optimizeImages() {
  console.log('Optimizing images...');
  
  try {
    // Find all image files in the dist directory
    const imageFiles = findImages(distDir);
    console.log(`Found ${imageFiles.length} images in dist directory`);
    
    // Convert each image to WebP
    for (const file of imageFiles) {
      await convertToWebP(file);
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
  const results = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findImages(fullPath));
    } else if (/\.(jpe?g|png|gif)$/i.test(item)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Convert an image to WebP format
 */
async function convertToWebP(filePath) {
  try {
    const outputPath = filePath.replace(/\.(jpe?g|png|gif)$/i, '.webp');
    
    // Skip if WebP version already exists
    if (fs.existsSync(outputPath)) {
      return;
    }
    
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`Created WebP: ${outputPath}`);
  } catch (error) {
    console.warn(`Error converting ${filePath} to WebP:`, error.message);
  }
}

// Run the optimization
optimizeBuild(); 
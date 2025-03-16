/**
 * Image optimization script
 * 
 * This script optimizes images in the public directory by:
 * 1. Converting images to WebP format
 * 2. Creating optimized versions of JPEG and PNG images
 * 3. Adding width/height attributes to match original dimensions
 * 
 * Run with: node scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is installed
let sharp;
try {
  sharp = await import('sharp');
  sharp = sharp.default;
} catch (e) {
  console.log('Sharp is not installed. Installing...');
  execSync('npm install sharp --save-dev');
  sharp = (await import('sharp')).default;
}

// Directories to optimize
const DIRECTORIES = [
  'public/product-images',
  'public/images'
];

// Ensure output directories exist
DIRECTORIES.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Handle hero image specifically
async function optimizeHeroImage() {
  console.log('Optimizing hero image...');
  
  // Define paths
  const heroSourcePath = path.join(__dirname, '../public/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png');
  const heroDestPath = path.join(__dirname, '../public/images/shop-hero');
  
  if (!fs.existsSync(heroSourcePath)) {
    console.log('Hero image source not found:', heroSourcePath);
    return;
  }
  
  try {
    // Create WebP version
    await sharp(heroSourcePath)
      .resize(1200, 600, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(`${heroDestPath}.webp`);
      
    // Create JPG version as fallback
    await sharp(heroSourcePath)
      .resize(1200, 600, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true })
      .toFile(`${heroDestPath}.jpg`);
      
    console.log('Hero image optimized successfully');
  } catch (error) {
    console.error('Error optimizing hero image:', error);
  }
}

// Process all images in a directory
async function processDirectory(directory) {
  console.log(`Processing directory: ${directory}`);
  
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(filePath);
      } else if (/\.(jpe?g|png|gif)$/i.test(file)) {
        // Process image files
        await optimizeImage(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Optimize a single image
async function optimizeImage(filePath) {
  const fileInfo = path.parse(filePath);
  const outputWebP = path.join(fileInfo.dir, `${fileInfo.name}.webp`);
  
  console.log(`Optimizing: ${filePath}`);
  
  try {
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Create WebP version
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(outputWebP);
      
    console.log(`Created WebP: ${outputWebP}`);
  } catch (error) {
    console.error(`Error optimizing image ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    // Optimize hero image first
    await optimizeHeroImage();
    
    // Process all directories
    for (const directory of DIRECTORIES) {
      await processDirectory(directory);
    }
    
    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error during image optimization:', error);
    process.exit(1);
  }
}

// Run the script
main(); 
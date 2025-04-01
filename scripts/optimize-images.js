/**
 * Image optimization script
 * 
 * This script optimizes images in the public directory by:
 * 1. Converting images to WebP and AVIF formats for modern browsers
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
    // Extract dimensions for proper aspect ratio
    const metadata = await sharp(heroSourcePath).metadata();
    
    // Create AVIF version - best compression
    await sharp(heroSourcePath)
      .resize(1200, 600, { fit: 'cover' })
      .avif({ quality: 70 })
      .toFile(`${heroDestPath}.avif`);
    
    // Create WebP version
    await sharp(heroSourcePath)
      .resize(1200, 600, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(`${heroDestPath}.webp`);
      
    // Create JPG version as fallback
    await sharp(heroSourcePath)
      .resize(1200, 600, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
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
  const outputAvif = path.join(fileInfo.dir, `${fileInfo.name}.avif`);
  
  console.log(`Optimizing: ${filePath}`);
  
  try {
    // Get image metadata for dimensions
    const metadata = await sharp(filePath).metadata();
    
    // Create AVIF version (best compression but not universal support)
    await sharp(filePath)
      .avif({ quality: 70 })
      .toFile(outputAvif);
    
    // Create WebP version (good compression and good support)
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(outputWebP);
      
    console.log(`Created WebP: ${outputWebP}`);
    console.log(`Created AVIF: ${outputAvif}`);
    
    // If it's a large image (>1MB), also create optimized versions in original format
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > 1024 * 1024) {
      const outputOptimized = path.join(fileInfo.dir, `${fileInfo.name}.optimized${fileInfo.ext}`);
      
      // Resize and optimize large images
      await sharp(filePath)
        .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
        .toFormat(fileInfo.ext.replace('.', ''), { quality: 85 })
        .toFile(outputOptimized);
      
      // Replace original with optimized version
      fs.renameSync(outputOptimized, filePath);
      console.log(`Optimized original: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error optimizing image ${filePath}:`, error);
  }
}

async function optimizeOgImage() {
  const inputFile = path.join(__dirname, '../public/og-image.png');
  const outputFileWebp = path.join(__dirname, '../public/og-image.webp');
  const outputFileAvif = path.join(__dirname, '../public/og-image.avif');
  const outputFileJpg = path.join(__dirname, '../public/og-image.jpg');
  
  try {
    // Create AVIF version (best compression)
    await sharp(inputFile)
      .resize(1200, 630)
      .avif({ quality: 70 })
      .toFile(outputFileAvif);
    
    console.log('Created AVIF version of og-image');
    
    // Create WebP version
    await sharp(inputFile)
      .resize(1200, 630)
      .webp({ quality: 85 })
      .toFile(outputFileWebp);
    
    console.log('Created WebP version of og-image');
    
    // Create JPG version as fallback
    await sharp(inputFile)
      .resize(1200, 630)
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
      .toFile(outputFileJpg);
    
    console.log('Created JPG version of og-image');
    
    // Get file sizes
    const pngSize = fs.statSync(inputFile).size;
    const avifSize = fs.statSync(outputFileAvif).size;
    const webpSize = fs.statSync(outputFileWebp).size;
    const jpgSize = fs.statSync(outputFileJpg).size;
    
    console.log(`Original PNG: ${Math.round(pngSize / 1024)}KB`);
    console.log(`Optimized AVIF: ${Math.round(avifSize / 1024)}KB (${Math.round((avifSize / pngSize) * 100)}%)`);
    console.log(`Optimized WebP: ${Math.round(webpSize / 1024)}KB (${Math.round((webpSize / pngSize) * 100)}%)`);
    console.log(`Optimized JPG: ${Math.round(jpgSize / 1024)}KB (${Math.round((jpgSize / pngSize) * 100)}%)`);
  } catch (err) {
    console.error('Error optimizing images:', err);
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
    
    // Run the optimization
    await optimizeOgImage();
    
    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error during image optimization:', error);
    process.exit(1);
  }
}

// Run the script
main(); 
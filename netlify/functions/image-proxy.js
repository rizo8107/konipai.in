/**
 * Netlify serverless function for image optimization
 * This function acts as a proxy to PocketBase images, adding:
 * 1. Server-side caching
 * 2. Automatic WebP conversion
 * 3. Image resizing
 * 4. Proper cache headers
 */

import fetch from 'node-fetch';
import sharp from 'sharp';

// Define image size configurations
const SIZES = {
  thumbnail: 100,
  small: 300,
  medium: 600,
  large: 1200
};

exports.handler = async (event) => {
  try {
    // Parse query parameters
    const { id, size = 'medium', format = 'webp' } = event.queryStringParameters || {};
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image ID is required' })
      };
    }
    
    // Build source URL to PocketBase
    const [recordId, filename] = id.split('/');
    const baseUrl = process.env.POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host';
    const collection = 'products';
    
    if (!recordId || !filename) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid image ID format. Expected recordId/filename' })
      };
    }
    
    // Fetch the original image
    const sourceUrl = `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
    const response = await fetch(sourceUrl);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` })
      };
    }
    
    // Get the image buffer
    const buffer = await response.buffer();
    
    // Optimize the image using sharp
    let transformer = sharp(buffer);
    
    // Resize if a valid size is specified
    const width = SIZES[size];
    if (width) {
      transformer = transformer.resize(width);
    }
    
    // Convert to requested format
    let contentType;
    let optimizedBuffer;
    
    switch (format) {
      case 'webp':
        optimizedBuffer = await transformer.webp({ quality: 85 }).toBuffer();
        contentType = 'image/webp';
        break;
      case 'avif':
        optimizedBuffer = await transformer.avif({ quality: 80 }).toBuffer();
        contentType = 'image/avif';
        break;
      case 'png':
        optimizedBuffer = await transformer.png({ compressionLevel: 9 }).toBuffer();
        contentType = 'image/png';
        break;
      case 'jpeg':
      case 'jpg':
        optimizedBuffer = await transformer.jpeg({ quality: 85, progressive: true }).toBuffer();
        contentType = 'image/jpeg';
        break;
      default:
        optimizedBuffer = await transformer.webp({ quality: 85 }).toBuffer();
        contentType = 'image/webp';
    }
    
    // Return the optimized image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': optimizedBuffer.length.toString(),
        'Vary': 'Accept'
      },
      body: optimizedBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process image' })
    };
  }
}; 
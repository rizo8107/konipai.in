import { Client, Storage, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const storage = new Storage(client);

// Storage bucket ID
const BUCKET_ID = 'product_images';

async function initializeStorage() {
    try {
        // Create storage bucket for product images
        const bucket = await storage.createBucket(
            BUCKET_ID,
            'Product Images',
            ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
            ['role:all'],
            ['role:all'],
            10 * 1024 * 1024, // Maximum file size: 10MB
            false, // Not enabling file encryption
            true, // Enabling file previews
            true, // Enabling file compression
        );

        console.log('Storage bucket created:', bucket);
    } catch (error: any) {
        if (error.code === 409) {
            console.log('Storage bucket already exists');
        } else {
            console.error('Error initializing storage:', error);
        }
    }
}

initializeStorage();
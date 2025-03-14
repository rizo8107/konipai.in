import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

// Database and collection IDs
const DATABASE_ID = 'konipai_db';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';
const USERS_COLLECTION_ID = 'users';

async function updateCollection() {
    try {
        // Update products collection attributes
        try {
            // Delete existing attributes first
            const attributes = await databases.listAttributes(DATABASE_ID, PRODUCTS_COLLECTION_ID);
            for (const attr of attributes.attributes) {
                await databases.deleteAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, attr.key);
            }

            // Add new attributes
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'name', 255, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'description', 5000, true);
            await databases.createFloatAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'price', true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'dimensions', 255, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'material', 255, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'category', 255, true);
            await databases.createBooleanAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'bestseller', true);
            await databases.createBooleanAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'new', true);
            await databases.createBooleanAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'inStock', true);
            
            // Array attributes
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'images', 255, true, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'features', 255, true, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'care', 255, true, true);
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'tags', 50, true, true);
            
            // Colors as JSON string
            await databases.createStringAttribute(DATABASE_ID, PRODUCTS_COLLECTION_ID, 'colors', 2000, true);

            console.log('Products collection updated with new attributes');
        } catch (error) {
            console.error('Error updating collection:', error);
            throw error;
        }

        console.log('Collection update completed successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

updateCollection();

import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

const DATABASE_ID = 'konipai_db';
const PRODUCTS_COLLECTION_ID = 'products';

async function initializeCollection() {
    try {
        // Create products collection
        try {
            const collection = await databases.createCollection(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                'Products',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('Collection created:', collection);

            // Add attributes
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

            console.log('Collection attributes created successfully');
        } catch (error) {
            if (error.code === 409) {
                console.log('Collection already exists');
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

initializeCollection(); 
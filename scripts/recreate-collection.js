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

async function recreateCollection() {
    try {
        // Delete existing collection if it exists
        try {
            await databases.deleteCollection(DATABASE_ID, PRODUCTS_COLLECTION_ID);
            console.log('Existing collection deleted');
        } catch (error) {
            if (error.code !== 404) {
                console.error('Error deleting collection:', error);
            }
        }

        // Wait a moment for the deletion to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create new collection
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

        // Wait for collection creation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add attributes one by one with delay to ensure proper creation
        const attributes = [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: true },
            { key: 'price', type: 'double', required: true },
            { key: 'dimensions', type: 'string', size: 100, required: false },
            { key: 'material', type: 'string', size: 100, required: false },
            { key: 'category', type: 'string', size: 50, required: true },
            { key: 'bestseller', type: 'boolean', required: true, default: false },
            { key: 'new', type: 'boolean', required: true, default: false },
            { key: 'inStock', type: 'boolean', required: true, default: true },
            { key: 'images', type: 'string', size: 255, required: false, array: true },
            { key: 'features', type: 'string', size: 500, required: false, array: true },
            { key: 'care', type: 'string', size: 500, required: false, array: true },
            { key: 'tags', type: 'string', size: 50, required: false, array: true },
            { key: 'colors', type: 'string', size: 2000, required: true }
        ];

        for (const attr of attributes) {
            try {
                const { key, type, size, required, array } = attr;
                console.log(`Creating attribute: ${key}`);

                switch (type) {
                    case 'string':
                        await databases.createStringAttribute(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_ID,
                            key,
                            size,
                            required,
                            null, // default
                            array || false,
                            false // encrypt
                        );
                        break;
                    case 'double':
                        await databases.createFloatAttribute(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_ID,
                            key,
                            required,
                            0, // min
                            1000000, // max
                            null, // default
                            array || false
                        );
                        break;
                    case 'boolean':
                        await databases.createBooleanAttribute(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_ID,
                            key,
                            required,
                            null, // default
                            array || false
                        );
                        break;
                    default:
                        throw new Error(`Unsupported attribute type: ${type}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`Created attribute: ${key}`);
            } catch (error) {
                console.error(`Error creating attribute ${attr.key}:`, error);
            }
        }

        console.log('Collection recreation completed successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

recreateCollection(); 
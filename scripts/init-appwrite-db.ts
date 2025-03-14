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

async function initializeDatabase() {
    try {
        // Create database
        const database = await databases.create(DATABASE_ID, 'Konipai Database');
        console.log('Database created:', database);

        // Create products collection
        try {
            const productsCollection = await databases.createCollection(
                database.$id,
                PRODUCTS_COLLECTION_ID,
                'Products'
            );

            // Add attributes to products collection
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'name', 255, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'description', 5000, true);
            await databases.createFloatAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'price', true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'images', 255, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'dimensions', 255, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'material', 255, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'care', 1000, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'category', 255, true);
            await databases.createStringAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'tags', 255, true);
            await databases.createBooleanAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'bestseller', true);
            await databases.createBooleanAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'new', true);
            await databases.createBooleanAttribute(database.$id, PRODUCTS_COLLECTION_ID, 'inStock', true);

            console.log('Products collection created with attributes');
        } catch (error) {
            if (error.code === 409) {
                console.log('Products collection already exists');
            } else {
                throw error;
            }
        }

        // Create orders collection
        try {
            const ordersCollection = await databases.createCollection(
                database.$id,
                ORDERS_COLLECTION_ID,
                'Orders'
            );

            // Add attributes to orders collection
            await databases.createStringAttribute(database.$id, ORDERS_COLLECTION_ID, 'userId', 100, true);
            await databases.createStringAttribute(database.$id, ORDERS_COLLECTION_ID, 'status', 50, true);
            await databases.createFloatAttribute(database.$id, ORDERS_COLLECTION_ID, 'totalAmount', true);
            await databases.createDatetimeAttribute(database.$id, ORDERS_COLLECTION_ID, 'orderDate', true);
            await databases.createStringAttribute(database.$id, ORDERS_COLLECTION_ID, 'shippingAddress', 1000, true);
            await databases.createStringAttribute(database.$id, ORDERS_COLLECTION_ID, 'items', 10000, true);

            console.log('Orders collection created with attributes');
        } catch (error) {
            if (error.code === 409) {
                console.log('Orders collection already exists');
            } else {
                throw error;
            }
        }

        // Create users collection
        try {
            const usersCollection = await databases.createCollection(
                database.$id,
                USERS_COLLECTION_ID,
                'Users'
            );

            // Add attributes to users collection
            await databases.createStringAttribute(database.$id, USERS_COLLECTION_ID, 'email', 255, true);
            await databases.createStringAttribute(database.$id, USERS_COLLECTION_ID, 'name', 255, true);
            await databases.createStringAttribute(database.$id, USERS_COLLECTION_ID, 'phone', 20, false);
            await databases.createStringAttribute(database.$id, USERS_COLLECTION_ID, 'address', 1000, false);
            await databases.createDatetimeAttribute(database.$id, USERS_COLLECTION_ID, 'createdAt', true);

            console.log('Users collection created with attributes');
        } catch (error) {
            if (error.code === 409) {
                console.log('Users collection already exists');
            } else {
                throw error;
            }
        }

        // Add sample products
        const sampleProducts = [
            {
                name: 'Classic Canvas Tote',
                description: 'Our signature tote bag made from durable canvas material.',
                price: 29.99,
                images: '/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png',
                dimensions: '14" x 16" x 4"',
                material: 'Canvas',
                care: 'Machine wash cold, Hang dry, Do not bleach',
                category: 'Canvas Totes',
                tags: 'canvas,classic,everyday',
                bestseller: true,
                new: false,
                inStock: true
            },
            {
                name: 'Eco-Friendly Jute Tote',
                description: 'Sustainable and stylish jute tote perfect for shopping.',
                price: 34.99,
                images: '/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png',
                dimensions: '15" x 14" x 5"',
                material: 'Jute',
                care: 'Spot clean only, Air dry, Store in cool dry place',
                category: 'Eco-Friendly',
                tags: 'jute,eco-friendly,sustainable',
                bestseller: false,
                new: true,
                inStock: true
            }
        ];

        for (const product of sampleProducts) {
            try {
                await databases.createDocument(database.$id, PRODUCTS_COLLECTION_ID, ID.unique(), product);
                console.log(`Created product: ${product.name}`);
            } catch (error) {
                console.error(`Error creating product ${product.name}:`, error);
            }
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initializeDatabase();
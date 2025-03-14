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

async function addProduct() {
    try {
        const newProduct = {
            name: 'Premium Leather Tote',
            description: 'Luxurious leather tote bag with premium craftsmanship. Features a spacious interior and multiple compartments for organization.',
            price: 149.99,
            images: '/product-images/premium-leather-tote.png',
            dimensions: '15" x 12" x 5"',
            material: 'Full-grain leather',
            care: 'Clean with leather cleaner, Condition regularly, Store in dust bag',
            category: 'Leather Totes',
            tags: 'leather,premium,luxury',
            bestseller: false,
            new: true,
            inStock: true
        };

        const response = await databases.createDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            ID.unique(),
            newProduct
        );

        console.log('Product added successfully:', response);
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

addProduct(); 
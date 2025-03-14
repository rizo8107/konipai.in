import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting product creation script...');
console.log('Environment variables:');
console.log('VITE_APPWRITE_ENDPOINT:', process.env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', process.env.VITE_APPWRITE_PROJECT_ID);

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = 'konipai_db';
const PRODUCTS_COLLECTION_ID = 'products';

async function addProduct() {
    try {
        console.log('Preparing product data...');
        const product = {
            name: 'Classic Canvas Tote',
            description: 'A timeless canvas tote bag perfect for everyday use. Made with durable materials and featuring a spacious interior.',
            price: 29.99,
            dimensions: '15" x 14" x 5"',
            material: 'Canvas',
            category: 'Tote Bags',
            bestseller: false,
            new: true,
            inStock: true,
            images: [
                'classic-tote-1.jpg',
                'classic-tote-2.jpg',
                'classic-tote-3.jpg'
            ],
            features: [
                'Large main compartment',
                'Interior zip pocket',
                'Reinforced handles',
                'Water-resistant bottom'
            ],
            care: [
                'Machine wash cold',
                'Do not bleach',
                'Line dry',
                'Iron on low heat if needed'
            ],
            tags: [
                'canvas',
                'classic',
                'everyday',
                'spacious'
            ],
            colors: JSON.stringify([
                { name: 'Natural', hex: '#F5F5DC' },
                { name: 'Black', hex: '#000000' },
                { name: 'Navy', hex: '#000080' }
            ])
        };

        console.log('Creating document in Appwrite...');
        console.log('Database ID:', DATABASE_ID);
        console.log('Collection ID:', PRODUCTS_COLLECTION_ID);
        console.log('Product data:', JSON.stringify(product, null, 2));

        const result = await databases.createDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            ID.unique(),
            product
        );

        console.log('Product added successfully!');
        console.log('Document ID:', result.$id);
        console.log('Created at:', new Date(result.$createdAt).toLocaleString());
        console.log('Full result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error adding product:');
        console.error('Error code:', error.code);
        console.error('Error type:', error.type);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
}

addProduct(); 
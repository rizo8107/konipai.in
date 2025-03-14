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

async function setupPermissions() {
    try {
        // Update products collection permissions
        await databases.updateCollection(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            'Products',
            [
                Permission.read(Role.any()), // Allow anyone to read
                Permission.create(Role.users()), // Only authenticated users can create
                Permission.update(Role.users()), // Only authenticated users can update
                Permission.delete(Role.users()) // Only authenticated users can delete
            ]
        );

        console.log('Permissions updated successfully');
    } catch (error) {
        console.error('Error updating permissions:', error);
    }
}

setupPermissions(); 
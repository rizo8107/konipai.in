import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = 'konipai_db';
const ORDERS_COLLECTION_ID = 'orders';

async function updatePermissions() {
    try {
        console.log('Updating permissions for orders collection...');
        
        // Update the orders collection permissions
        const updatedCollection = await databases.updateCollection(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            'Orders',
            [
                // Allow users to read their own orders
                Permission.read(Role.user('userId')),
                // Allow users to create their own orders
                Permission.create(Role.users()),
                // Allow users to update their own orders
                Permission.update(Role.user('userId')),
                // Allow users to delete their own orders
                Permission.delete(Role.user('userId')),
                // Allow server to manage all orders
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ]
        );
        
        console.log('Successfully updated permissions for orders collection!');
        console.log('Updated collection:', updatedCollection);
        
    } catch (error) {
        console.error('Error updating permissions:', error);
    }
}

// Run the update function
updatePermissions(); 
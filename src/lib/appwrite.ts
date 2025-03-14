import { Client, Account, Databases, Storage } from 'appwrite';

// Debug environment variables
console.log('VITE_APPWRITE_ENDPOINT:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize the Appwrite client
// IMPORTANT: For production deployments, make sure to add your deployment URL
// to the list of allowed platforms in the Appwrite console under Project Settings > Platforms
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1') // Add fallback URL
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); // Your project ID

// Export constants for use throughout the application
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const DATABASE_ID = 'konipai_db';
export const PRODUCTS_COLLECTION_ID = 'products';
export const ORDERS_COLLECTION_ID = 'orders';
export const USERS_COLLECTION_ID = 'users';
export const ADDRESSES_COLLECTION_ID = 'addresses';

// Initialize and export Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
import { config } from 'dotenv';
import { Client, Databases } from 'node-appwrite';

// Load environment variables
config();

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = 'konipai_db';
const COLLECTION_ID = 'addresses';

async function createAddressIndexes() {
  try {
    console.log('Creating indexes for Addresses collection...');
    
    // Create index for userId (for faster queries)
    console.log('Creating userId index...');
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'userId_index',
      'key',
      ['userId']
    );
    
    // Create index for isDefault (for faster queries)
    console.log('Creating isDefault index...');
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'isDefault_index',
      'key',
      ['isDefault']
    );
    
    console.log('Indexes created successfully!');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

createAddressIndexes(); 
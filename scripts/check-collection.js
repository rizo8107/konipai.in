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

async function checkCollection() {
  try {
    console.log('Checking collection structure...');
    
    // Get collection details
    const collection = await databases.getCollection(
      DATABASE_ID,
      COLLECTION_ID
    );
    
    console.log('Collection details:', collection);
    
    // Get collection attributes
    const attributes = await databases.listAttributes(
      DATABASE_ID,
      COLLECTION_ID
    );
    
    console.log('Collection attributes:');
    console.log(JSON.stringify(attributes, null, 2));
    
    // Get collection indexes
    const indexes = await databases.listIndexes(
      DATABASE_ID,
      COLLECTION_ID
    );
    
    console.log('Collection indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
  } catch (error) {
    console.error('Error checking collection:', error);
  }
}

checkCollection(); 
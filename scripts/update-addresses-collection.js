import { config } from 'dotenv';
import { Client, Databases, ID } from 'node-appwrite';

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

async function updateAddressesCollection() {
  try {
    console.log('Updating Addresses collection...');
    
    // Create userId attribute (required)
    console.log('Creating userId attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'userId',
      255,
      true // required
    );
    
    // Create name attribute (required)
    console.log('Creating name attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'name',
      255,
      true // required
    );
    
    // Create street attribute (required)
    console.log('Creating street attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'street',
      255,
      true // required
    );
    
    // Create city attribute (required)
    console.log('Creating city attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'city',
      255,
      true // required
    );
    
    // Create state attribute (required)
    console.log('Creating state attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'state',
      255,
      true // required
    );
    
    // Create zipCode attribute (required)
    console.log('Creating zipCode attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'zipCode',
      20,
      true // required
    );
    
    // Create country attribute (required)
    console.log('Creating country attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'country',
      255,
      true // required
    );
    
    // Create isDefault attribute (required)
    console.log('Creating isDefault attribute...');
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'isDefault',
      true // required
    );
    
    // Wait for attributes to be available before creating indexes
    console.log('Waiting for attributes to be available...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create index for userId (for faster queries)
    console.log('Creating userId index...');
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'userId_index',
      ['userId'],
      'key' // Valid types: key, fulltext, unique
    );
    
    // Create index for isDefault (for faster queries)
    console.log('Creating isDefault index...');
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'isDefault_index',
      ['isDefault'],
      'key' // Valid types: key, fulltext, unique
    );
    
    console.log('Addresses collection updated successfully!');
    
  } catch (error) {
    console.error('Error updating Addresses collection:', error);
  }
}

updateAddressesCollection(); 
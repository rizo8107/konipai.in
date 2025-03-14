import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { Client, Databases } from 'node-appwrite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the config file
const appwriteConfig = JSON.parse(
  await readFile(join(__dirname, '..', 'appwrite.json'), 'utf-8')
);

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function createCollection(databaseId, collection) {
  try {
    console.log(`Creating collection: ${collection.name}`);
    
    // Create collection
    try {
      await databases.createCollection(
        databaseId,
        collection.id,
        collection.name,
        collection.permissions
      );
      console.log(`Collection ${collection.name} created`);
    } catch (error) {
      if (error.code !== 409) { // 409 means collection already exists
        throw error;
      }
      console.log(`Collection ${collection.name} already exists`);
    }

    // Create attributes
    for (const attribute of collection.attributes) {
      try {
        console.log(`Creating attribute: ${attribute.key}`);
        
        if (attribute.type === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collection.id,
            attribute.key,
            attribute.required,
            attribute.array,
            undefined,
            attribute.default,
            attribute.elements
          );
        } else if (attribute.type === 'integer') {
          await databases.createIntegerAttribute(
            databaseId,
            collection.id,
            attribute.key,
            attribute.required,
            attribute.array,
            attribute.min,
            attribute.max,
            attribute.default
          );
        } else if (attribute.type === 'double') {
          await databases.createFloatAttribute(
            databaseId,
            collection.id,
            attribute.key,
            attribute.required,
            attribute.array,
            attribute.min,
            attribute.max,
            attribute.default
          );
        } else if (attribute.type === 'boolean') {
          await databases.createBooleanAttribute(
            databaseId,
            collection.id,
            attribute.key,
            attribute.required,
            attribute.array,
            attribute.default
          );
        } else if (attribute.type === 'object') {
          if (attribute.array) {
            await databases.createStringAttribute(
              databaseId,
              collection.id,
              attribute.key,
              attribute.required,
              true
            );
          } else {
            await databases.createStringAttribute(
              databaseId,
              collection.id,
              attribute.key,
              attribute.required,
              false
            );
          }
        }
        console.log(`Attribute ${attribute.key} created`);
      } catch (error) {
        if (error.code !== 409) { // 409 means attribute already exists
          console.error(`Error creating attribute ${attribute.key}:`, error);
        } else {
          console.log(`Attribute ${attribute.key} already exists`);
        }
      }
    }

    // Create indexes
    if (collection.indexes) {
      for (const index of collection.indexes) {
        try {
          console.log(`Creating index: ${index.key}`);
          await databases.createIndex(
            databaseId,
            collection.id,
            index.key,
            index.type,
            index.attributes
          );
          console.log(`Index ${index.key} created`);
        } catch (error) {
          if (error.code !== 409) { // 409 means index already exists
            console.error(`Error creating index ${index.key}:`, error);
          } else {
            console.log(`Index ${index.key} already exists`);
          }
        }
      }
    }

    console.log(`Collection ${collection.name} setup completed`);
  } catch (error) {
    console.error(`Error setting up collection ${collection.name}:`, error);
  }
}

async function deploy() {
  try {
    for (const database of appwriteConfig.databases) {
      console.log(`Processing database: ${database.name}`);
      
      try {
        // Try to get the database to verify it exists
        await databases.get(database.id);
        console.log(`Using existing database: ${database.name}`);
        
        // Create collections
        for (const collection of database.collections) {
          await createCollection(database.id, collection);
        }
      } catch (error) {
        console.error(`Error: Database ${database.name} (${database.id}) not found. Please create it first in the Appwrite console.`);
        process.exit(1);
      }
    }

    console.log('Deployment completed successfully');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy(); 
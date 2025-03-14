import { config } from 'dotenv';
import { Client, Teams } from 'node-appwrite';
import readline from 'readline';

// Load environment variables
config();

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(client);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * This script provides guidance on updating Appwrite platform settings
 * to allow requests from your Netlify deployment.
 */
async function updatePlatforms() {
  try {
    console.log('\n=== Appwrite Platform Configuration Guide ===\n');
    console.log('This script will help you configure your Appwrite project to work with Netlify.');
    console.log('CORS errors occur when your Netlify domain is not registered in Appwrite platforms.\n');
    
    // Check if API key is set
    if (!process.env.APPWRITE_API_KEY) {
      console.error('Error: APPWRITE_API_KEY is not set in your .env file.');
      console.log('\nTo fix this:');
      console.log('1. Go to your Appwrite console: https://cloud.appwrite.io/console');
      console.log('2. Navigate to your project > API Keys');
      console.log('3. Create a new API key with the following permissions:');
      console.log('   - teams.read');
      console.log('4. Add the API key to your .env file as APPWRITE_API_KEY=your-api-key');
      process.exit(1);
    }
    
    // Get Netlify URL from user
    rl.question('Enter your Netlify URL (e.g., https://konipai.netlify.app): ', async (netlifyUrl) => {
      if (!netlifyUrl) {
        console.error('Error: Netlify URL is required.');
        rl.close();
        process.exit(1);
      }
      
      // Remove trailing slash if present
      netlifyUrl = netlifyUrl.endsWith('/') ? netlifyUrl.slice(0, -1) : netlifyUrl;
      
      console.log('\nTo update your Appwrite platforms:');
      console.log('1. Go to your Appwrite console: https://cloud.appwrite.io/console');
      console.log('2. Select your project');
      console.log('3. Go to Settings > Platforms');
      console.log('4. Add a new Web platform with the following details:');
      console.log(`   - Name: Netlify Deployment`);
      console.log(`   - Hostname: ${netlifyUrl}`);
      console.log('5. Click "Register" to save the platform');
      
      console.log('\nAfter adding the platform, redeploy your Netlify site or wait a few minutes for the changes to take effect.');
      
      rl.close();
    });
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

updatePlatforms(); 
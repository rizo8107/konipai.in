// Script to add the capture payment endpoint to the PocketBase admin API endpoints collection
import PocketBase from 'pocketbase';

// Update with your admin credentials
const ADMIN_EMAIL = 'your-admin-email@example.com';
const ADMIN_PASSWORD = 'your-admin-password';
const POCKETBASE_URL = 'https://backend-pocketbase.7za6uc.easypanel.host';

async function addCaptureEndpoint() {
  try {
    console.log('🔑 Authenticating to PocketBase admin...');
    const pb = new PocketBase(POCKETBASE_URL);
    
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authentication successful!');
    
    // Check if endpoint already exists
    console.log('🔍 Checking for existing endpoint...');
    const existingEndpoints = await pb.collection('api_endpoints').getList(1, 50, {
      filter: 'endpoint = "/razorpay/capture-payment"'
    });
    
    if (existingEndpoints.items.length > 0) {
      console.log('⚠️ Endpoint already exists, updating...');
      const existingId = existingEndpoints.items[0].id;
      
      await pb.collection('api_endpoints').update(existingId, {
        endpoint: '/razorpay/capture-payment',
        method: 'POST',
        is_active: true
      });
      
      console.log('✅ Endpoint updated successfully!');
    } else {
      console.log('🆕 Creating new endpoint...');
      
      await pb.collection('api_endpoints').create({
        endpoint: '/razorpay/capture-payment',  // Without /api/ prefix
        method: 'POST',
        is_active: true
      });
      
      console.log('✅ Endpoint created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
addCaptureEndpoint();

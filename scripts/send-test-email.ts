import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the PocketBase client
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function sendTestEmail() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || '',
            process.env.POCKETBASE_ADMIN_PASSWORD || ''
        );
        console.log('✅ Successfully authenticated as admin');

        const emailRecipient = 'nirmal@lifedemy.in'; // The recipient's email
        console.log(`Sending test email to ${emailRecipient}...`);

        // First, check if we have the test user account or create one
        let testUser;
        try {
            // Try to find a user with the recipient email
            const userSearch = await pb.collection('users').getFirstListItem(`email="${emailRecipient}"`);
            testUser = userSearch;
            console.log('Using existing user account for the test email');
        } catch (e) {
            // If user doesn't exist, create a test user
            console.log('Creating a test user account...');
            testUser = await pb.collection('users').create({
                email: emailRecipient,
                password: 'Test12345!@#', // This is just a test account
                passwordConfirm: 'Test12345!@#',
                name: 'Test User',
                emailVisibility: true,
            });
            console.log('Test user created successfully');
        }

        // Create a test order to trigger the order confirmation email
        const testOrder = await pb.collection('orders').create({
            user: testUser.id,
            products: JSON.stringify([
                {
                    id: 'test_product_1',
                    name: 'Test Product',
                    price: 10000, // ₹100.00 (in paisa)
                    quantity: 2,
                    color: 'Red'
                },
                {
                    id: 'test_product_2',
                    name: 'Another Test Product',
                    price: 15000, // ₹150.00 (in paisa)
                    quantity: 1,
                    color: 'Blue'
                }
            ]),
            totalAmount: 35000, // ₹350.00 (in paisa)
            shipping_fee: 5000, // ₹50.00 (in paisa)
            status: 'pending',
            payment_status: 'paid',
            shipping_address: 'Test Address, Test City, Test State 123456, India'
        });

        console.log(`✅ Test order created with ID: ${testOrder.id}`);
        console.log('✅ Order confirmation email should be sent automatically via PocketBase hooks');
        console.log('Please check your email inbox for the test email');

    } catch (error) {
        console.error('❌ Error sending test email:', error);
    }
}

sendTestEmail().catch(console.error); 
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

// Initialize PocketBase
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function sendTestEmail() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || '',
            process.env.POCKETBASE_ADMIN_PASSWORD || ''
        );
        console.log('✅ Successfully authenticated as admin');

        const recipient = 'nirmal@lifedemy.in';
        const subject = 'Test Email from Konipai Order System';
        
        // Create email content
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://konipai.in/assets/logo.png" alt="Konipai Logo" style="max-width: 150px;">
            </div>
            
            <h1 style="color: #333; text-align: center;">Test Email</h1>
            
            <p>Hello,</p>
            
            <p>This is a test email from the Konipai Order Email Notification System.</p>
            
            <p>If you're receiving this email, it means the email configuration for Konipai's PocketBase is working correctly.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #444; font-size: 18px;">Email System Details</h2>
                <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            </div>
            
            <p>You can now expect to receive order confirmation emails whenever customers place orders.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #777; font-size: 12px;">
                <p>This is an automated message from Konipai's order system.</p>
                <p>&copy; ${new Date().getFullYear()} Konipai. All rights reserved.</p>
            </div>
        </div>
        `;
        
        // Send the email
        console.log(`Sending test email to ${recipient}...`);
        
        // Use PocketBase's API directly
        const result = await pb.send('/api/_', {
            method: 'POST',
            body: {
                action: 'settings.testEmail',
                email: recipient,
                subject: subject,
                html: htmlContent
            }
        });
        
        console.log('✅ Test email sent successfully!');
        console.log(result);
        
    } catch (error) {
        console.error('❌ Error sending test email:', error);
    }
}

// Execute the function
sendTestEmail().catch(console.error); 
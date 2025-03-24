import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Define the fixed SMTP configuration for Gmail
const SMTP_CONFIG = {
  enabled: true,
  host: "smtp.gmail.com",
  port: 587,
  auth: true,
  username: "konipaishop@gmail.com",
  password: "zjpb kdvh pgty nouk",
  tls: true
};

// Print configuration information
console.log('==============================================');
console.log('PocketBase Email Configuration');
console.log('==============================================');
console.log(`VITE_POCKETBASE_URL: ${process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'}`);
console.log(`SMTP Host: ${SMTP_CONFIG.host}`);
console.log(`SMTP Port: ${SMTP_CONFIG.port}`);
console.log(`SMTP Username: ${SMTP_CONFIG.username}`);
console.log(`SMTP TLS Enabled: ${SMTP_CONFIG.tls}`);
console.log('==============================================');

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Define interface for PocketBase error
interface PocketBaseError extends Error {
  status?: number;
  response?: {
    message: string;
    data?: Record<string, unknown>;
  };
}

async function configureEmailSettings() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
    console.log('✅ Successfully authenticated as admin');

    // Get the current settings
    const settings = await pb.settings.getAll();
    console.log('📧 Current email settings:', settings.smtp);

    // Prepare the updated settings with Gmail SMTP configuration
    const updatedSettings = {
      ...settings,
      smtp: SMTP_CONFIG
    };

    // Update the settings
    await pb.settings.update(updatedSettings);
    console.log('✅ SMTP settings updated successfully with Gmail configuration!');

    // Save settings as environment variables in .env file
    const envFilePath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }

    // Update or add SMTP settings
    const envVars = {
      SMTP_ENABLED: SMTP_CONFIG.enabled.toString(),
      SMTP_HOST: SMTP_CONFIG.host,
      SMTP_PORT: SMTP_CONFIG.port.toString(),
      SMTP_AUTH: SMTP_CONFIG.auth.toString(),
      SMTP_USERNAME: SMTP_CONFIG.username,
      SMTP_PASSWORD: "# SMTP_PASSWORD is stored in PocketBase settings",
      SMTP_TLS: SMTP_CONFIG.tls.toString()
    };

    // Process each environment variable
    Object.entries(envVars).forEach(([key, value]) => {
      // Check if the variable already exists in the file
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        // Replace existing variable
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new variable
        envContent += `\n${key}=${value}`;
      }
    });

    // Write the updated content back to the .env file
    fs.writeFileSync(envFilePath, envContent);
    console.log('✅ Environment variables updated in .env file');

    // Test the email configuration
    console.log('\n🧪 Testing email configuration...');
    const testResult = await pb.send('/api/settings/test-email', {
      method: 'POST',
      body: {
        email: process.env.POCKETBASE_ADMIN_EMAIL || ''
      }
    });

    console.log('✉️ Test email sent! Please check your inbox.');
    console.log('✅ Configuration complete. Your order emails should now be working.');

  } catch (error) {
    const pbError = error as PocketBaseError;
    console.error('❌ Error configuring email settings:', pbError);
    console.error('Details:', pbError.message);
    
    if (pbError.status === 404) {
      console.log('\n🔍 The test email endpoint might not be available. Let\'s try sending a real email instead.');
      
      try {
        // Create and send a real test email
        await sendManualTestEmail();
      } catch (emailError) {
        console.error('❌ Error sending manual test email:', emailError);
      }
    }
  }
}

// Function to send a direct test email
async function sendManualTestEmail() {
  try {
    const senderEmail = SMTP_CONFIG.username;
    const recipientEmail = process.env.POCKETBASE_ADMIN_EMAIL || senderEmail;
    
    console.log(`Sending test email from ${senderEmail} to ${recipientEmail}...`);
    
    // Create email content
    const subject = "Konipai Email Configuration Test";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Email Configuration Test</h1>
        <p>This is a test email from your Konipai store's order processing system.</p>
        <p>If you're receiving this email, your SMTP configuration is working correctly!</p>
        <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p>SMTP Configuration:</p>
        <ul>
          <li>Host: ${SMTP_CONFIG.host}</li>
          <li>Port: ${SMTP_CONFIG.port}</li>
          <li>TLS Enabled: ${SMTP_CONFIG.tls}</li>
          <li>Username: ${SMTP_CONFIG.username}</li>
        </ul>
        <p style="color: #777; font-size: 12px; margin-top: 30px; text-align: center;">
          Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    `;
    
    // Send the email directly using the mail client
    const result = await pb.send('api/_', {
      method: 'POST',
      body: {
        action: 'custom_email',
        from: senderEmail,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
      }
    });
    
    console.log('✉️ Manual test email sent!');
    return result;
  } catch (error) {
    console.error('Failed to send manual test email:', error);
    throw error;
  }
}

configureEmailSettings().catch(console.error); 
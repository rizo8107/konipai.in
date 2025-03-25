import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

// Print environment variables being used (without printing sensitive information)
console.log('==============================================');
console.log('PocketBase Email Configuration');
console.log('==============================================');
console.log(`VITE_POCKETBASE_URL: ${process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'}`);
console.log(`POCKETBASE_ADMIN_EMAIL: ${process.env.POCKETBASE_ADMIN_EMAIL?.substring(0, 3)}...`);
console.log('==============================================');

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

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

        // Prompt the user for SMTP configuration
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Default values based on common email providers (can be customized)
        const defaultSmtpConfig = {
            enabled: true,
            host: "smtp.gmail.com",
            port: 587,
            auth: true,
            username: "your-email@gmail.com",
            password: "your-app-password", // For Gmail, use an App Password
            tls: true
        };

        console.log('\n📋 Please provide SMTP configuration (or press Enter to use defaults/current values):');

        const askQuestion = (question: string, defaultValue: string) => {
            return new Promise<string>((resolve) => {
                rl.question(`${question} (default: ${defaultValue}): `, (answer: string) => {
                    resolve(answer || defaultValue);
                });
            });
        };

        // Ask for all required SMTP settings
        const enabled = await askQuestion('Enable SMTP?', defaultSmtpConfig.enabled.toString()) === 'true';
        const host = await askQuestion('SMTP Host', settings.smtp?.host || defaultSmtpConfig.host);
        const port = parseInt(await askQuestion('SMTP Port', (settings.smtp?.port || defaultSmtpConfig.port).toString()));
        const auth = await askQuestion('Use Authentication?', (settings.smtp?.auth === undefined ? defaultSmtpConfig.auth : settings.smtp.auth).toString()) === 'true';
        const username = auth ? await askQuestion('SMTP Username', settings.smtp?.username || defaultSmtpConfig.username) : '';
        const password = auth ? await askQuestion('SMTP Password', '********') : '';
        const tls = await askQuestion('Use TLS?', (settings.smtp?.tls === undefined ? defaultSmtpConfig.tls : settings.smtp.tls).toString()) === 'true';
        
        // Close the readline interface
        rl.close();

        // Prepare the updated settings
        const updatedSettings = {
            ...settings,
            smtp: {
                enabled,
                host,
                port,
                auth,
                username,
                password: password === '********' ? settings.smtp?.password : password,
                tls
            }
        };

        // Update the settings
        await pb.settings.update(updatedSettings);
        console.log('✅ SMTP settings updated successfully!');

        // Save settings as environment variables in .env file
        const envFilePath = path.join(process.cwd(), '.env');
        let envContent = '';
        
        if (fs.existsSync(envFilePath)) {
            envContent = fs.readFileSync(envFilePath, 'utf8');
        }

        // Update or add SMTP settings
        const envVars = {
            SMTP_ENABLED: enabled.toString(),
            SMTP_HOST: host,
            SMTP_PORT: port.toString(),
            SMTP_AUTH: auth.toString(),
            SMTP_USERNAME: username,
            SMTP_PASSWORD: password === '********' ? '# SMTP_PASSWORD is stored in PocketBase settings' : password,
            SMTP_TLS: tls.toString()
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
        const testResult = await pb.send('/api/_', {
            method: 'POST',
            body: {
                action: 'settings.testEmail',
                email: process.env.POCKETBASE_ADMIN_EMAIL || ''
            }
        });

        console.log('✉️ Test email sent! Please check your inbox.');
        console.log('✅ Configuration complete. Your order emails should now be working.');

    } catch (error) {
        console.error('❌ Error configuring email settings:', error);
    }
}

configureEmailSettings().catch(console.error); 
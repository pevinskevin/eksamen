#!/usr/bin/env node

/**
 * Session Cookie Generator for API Testing
 *
 * Usage:
 *   node scripts/get-session-cookie.js
 *   node scripts/get-session-cookie.js admin@test.com test1234
 *   node scripts/get-session-cookie.js user@example.com password123
 */

const API_BASE_URL = 'http://localhost:8080/api';

// Default credentials
const DEFAULT_EMAIL = 'admin@test.com';
const DEFAULT_PASSWORD = 'test1234';

async function getSessionCookie(email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD) {
    try {
        console.log('🔑 Attempting to login...');
        console.log(`📧 Email: ${email}`);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
            credentials: 'include', // Important for cookie handling
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Login failed: ${errorData.message || response.statusText}`);
        }

        // Extract session cookie from response headers
        const setCookieHeader = response.headers.get('set-cookie');
        if (!setCookieHeader) {
            throw new Error('No session cookie received from server');
        }

        // Parse the connect.sid cookie value
        const cookieMatch = setCookieHeader.match(/connect\.sid=([^;]+)/);
        if (!cookieMatch) {
            throw new Error('Could not extract connect.sid cookie from response');
        }

        const cookieValue = cookieMatch[1];
        const userData = await response.json();

        console.log('\n✅ Login successful!');
        console.log('👤 User Info:');
        console.log(`   ID: ${userData.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
        console.log(`   Role: ${userData.role}`);

        console.log('\n🍪 Session Cookie for Swagger UI:');
        console.log('='.repeat(60));
        console.log(cookieValue);
        console.log('='.repeat(60));

        console.log('\n📋 Instructions:');
        console.log('1. Copy the cookie value above');
        console.log('2. Go to http://localhost:8080/docs');
        console.log('3. Click "Authorize" button');
        console.log('4. Paste the cookie value in the "Value" field');
        console.log('5. Click "Authorize" then "Close"');

        console.log('\n⏰ Note: This session will expire in 15 minutes');

        return cookieValue;
    } catch (error) {
        console.error('\n❌ Error getting session cookie:');
        console.error(error.message);

        if (error.message.includes('Login failed')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Check if the user exists');
            console.log('• Verify the password is correct');
            console.log('• Ensure the server is running on http://localhost:8080');
        }

        process.exit(1);
    }
}

// Get credentials from command line arguments or use defaults
const email = process.argv[2] || DEFAULT_EMAIL;
const password = process.argv[3] || DEFAULT_PASSWORD;

// Run the script
getSessionCookie(email, password);

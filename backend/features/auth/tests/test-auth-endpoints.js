// Test script for auth endpoints using fetch
// Run with: node features/auth/tests/test-auth-endpoints.js

const BASE_URL = 'http://localhost:8080/api';

// Test data
const adminUser = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin.test.com',
    password: 'test',
    repeatPassword: 'test',
};

const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'testpassword123',
    repeatPassword: 'testpassword123',
};

// Helper function to make requests with session handling
let sessionCookie = '';

async function makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(sessionCookie && { Cookie: sessionCookie }),
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    // Capture session cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
        sessionCookie = setCookie.split(';')[0];
        console.log('📍 Session cookie captured');
    }

    return {
        status: response.status,
        data: await response.json().catch(() => ({})),
        headers: response.headers,
    };
}

async function testAuthEndpoints() {
    console.log('🧪 Testing Auth Endpoints\n');

    try {
        // Test 1: Register new user
        console.log('1️⃣ Testing POST /api/register');
        const registerResponse = await makeRequest('/register', 'POST', testUser);

        console.log(`   Status: ${registerResponse.status}`);
        console.log(`   Response:`, registerResponse.data);

        if (registerResponse.status === 201) {
            console.log('   ✅ Registration successful!\n');
        } else {
            console.log('   ❌ Registration failed!\n');
        }

        // Test 2: Login with valid credentials
        console.log('2️⃣ Testing POST /api/login');
        const loginData = {
            email: testUser.email,
            password: testUser.password,
        };

        const loginResponse = await makeRequest('/login', 'POST', loginData);

        console.log(`   Status: ${loginResponse.status}`);
        console.log(`   Response:`, loginResponse.data);

        if (loginResponse.status === 200) {
            console.log('   ✅ Login successful!\n');
        } else {
            console.log('   ❌ Login failed!\n');
        }

        // Test 3: Logout
        console.log('3️⃣ Testing POST /api/logout');
        const logoutResponse = await makeRequest('/logout', 'POST');

        console.log(`   Status: ${logoutResponse.status}`);
        console.log(`   Response:`, logoutResponse.data);

        if (logoutResponse.status === 200) {
            console.log('   ✅ Logout successful!\n');
        } else {
            console.log('   ❌ Logout failed!\n');
        }

        // Test 4: Login with invalid credentials
        console.log('4️⃣ Testing POST /api/login (invalid credentials)');
        const invalidLogin = {
            email: testUser.email,
            password: 'wrongpassword',
        };

        const invalidLoginResponse = await makeRequest('/login', 'POST', invalidLogin);

        console.log(`   Status: ${invalidLoginResponse.status}`);
        console.log(`   Response:`, invalidLoginResponse.data);

        if (invalidLoginResponse.status === 401) {
            console.log('   ✅ Invalid credentials properly rejected!\n');
        } else {
            console.log('   ❌ Invalid credentials should be rejected!\n');
        }

        // Test 5: Register with missing fields (OpenAPI validation test)
        console.log('5️⃣ Testing POST /api/register (missing fields)');
        const invalidUser = {
            email: 'test2@example.com',
            // Missing firstName, lastName, password, repeatPassword
        };

        const invalidRegisterResponse = await makeRequest('/register', 'POST', invalidUser);

        console.log(`   Status: ${invalidRegisterResponse.status}`);
        console.log(`   Response:`, invalidRegisterResponse.data);

        if (invalidRegisterResponse.status === 400) {
            console.log('   ✅ Missing fields properly caught by OpenAPI validator!\n');
        } else {
            console.log('   ❌ Missing fields should be caught!\n');
        }

        // Test 6: Login with missing password (OpenAPI validation test)
        console.log('6️⃣ Testing POST /api/login (missing password)');
        const missingPassword = {
            email: testUser.email,
            // Missing password
        };

        const missingPasswordResponse = await makeRequest('/login', 'POST', missingPassword);

        console.log(`   Status: ${missingPasswordResponse.status}`);
        console.log(`   Response:`, missingPasswordResponse.data);

        if (missingPasswordResponse.status === 400) {
            console.log('   ✅ Missing password properly caught by OpenAPI validator!\n');
        } else {
            console.log('   ❌ Missing password should be caught!\n');
        }

        // Test 7: Register with mismatched passwords
        console.log('7️⃣ Testing POST /api/register (mismatched passwords)');
        const mismatchedPasswords = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'password123',
            repeatPassword: 'differentpassword',
        };

        const mismatchResponse = await makeRequest('/register', 'POST', mismatchedPasswords);

        console.log(`   Status: ${mismatchResponse.status}`);
        console.log(`   Response:`, mismatchResponse.data);

        if (mismatchResponse.status === 400) {
            console.log('   ✅ Password mismatch properly caught!\n');
        } else {
            console.log('   ❌ Password mismatch should be caught!\n');
        }

        console.log('🎉 All tests completed!');
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the tests
testAuthEndpoints();

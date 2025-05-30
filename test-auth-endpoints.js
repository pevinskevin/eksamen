const baseUrl = 'http://localhost:8080/api';

// Helper function to make requests
async function makeRequest(method, url, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    return {
        status: response.status,
        data: responseData,
        headers: response.headers,
    };
}

async function testAuthEndpoints() {
    console.log('🚀 Testing Auth Endpoints Against OpenAPI Spec...\n');

    // Generate unique email for this test run
    const uniqueEmail = `test-${Date.now()}@example.com`;

    // Test 1: Register with valid data
    console.log('📝 Test 1: Register with valid data');
    try {
        const registerData = {
            firstName: 'Test',
            lastName: 'User',
            email: uniqueEmail,
            password: 'TestPass123',
            repeatPassword: 'TestPass123',
        };

        const result = await makeRequest('POST', `${baseUrl}/register`, registerData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

        if (result.status === 201) {
            console.log('   ✅ SUCCESS: User registered');

            // Check if response matches User schema (camelCase)
            const user = result.data;
            if (user.id && user.email && user.firstName && user.lastName && user.role) {
                console.log('   ✅ SUCCESS: Response matches User schema');
            } else {
                console.log('   ❌ FAIL: Response missing required User fields');
                console.log('   Expected: id, email, firstName, lastName, role');
                console.log(`   Got: ${Object.keys(user).join(', ')}`);
            }
        } else {
            console.log('   ❌ FAIL: Registration failed');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Register with duplicate email
    console.log('📝 Test 2: Register with duplicate email (should fail)');
    try {
        const duplicateData = {
            firstName: 'Another',
            lastName: 'User',
            email: uniqueEmail, // Same email
            password: 'TestPass123',
            repeatPassword: 'TestPass123',
        };

        const result = await makeRequest('POST', `${baseUrl}/register`, duplicateData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

        if (result.status === 400) {
            console.log('   ✅ SUCCESS: Duplicate email properly rejected');

            // Check error response structure
            if (result.data.error && result.data.message) {
                console.log('   ✅ SUCCESS: Error response matches Error schema');
            } else {
                console.log('   ❌ FAIL: Error response missing required fields');
                console.log('   Expected: error, message');
                console.log(`   Got: ${Object.keys(result.data).join(', ')}`);
            }
        } else {
            console.log('   ❌ FAIL: Should have rejected duplicate email');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Login with valid credentials
    console.log('📝 Test 3: Login with valid credentials');
    try {
        const loginData = {
            email: uniqueEmail,
            password: 'TestPass123',
        };

        const result = await makeRequest('POST', `${baseUrl}/login`, loginData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

        if (result.status === 200) {
            console.log('   ✅ SUCCESS: Login successful');

            // Check if response matches LoginResponse schema
            const loginResponse = result.data;
            if (
                loginResponse.id &&
                loginResponse.email &&
                loginResponse.firstName &&
                loginResponse.lastName &&
                loginResponse.role
            ) {
                console.log('   ✅ SUCCESS: Response matches LoginResponse schema');
            } else {
                console.log('   ❌ FAIL: Response missing required LoginResponse fields');
                console.log('   Expected: id, email, firstName, lastName, role');
                console.log(`   Got: ${Object.keys(loginResponse).join(', ')}`);
            }
        } else {
            console.log('   ❌ FAIL: Login failed');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Login with invalid credentials
    console.log('📝 Test 4: Login with invalid credentials (should fail)');
    try {
        const invalidLoginData = {
            email: uniqueEmail,
            password: 'WrongPassword',
        };

        const result = await makeRequest('POST', `${baseUrl}/login`, invalidLoginData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

        if (result.status === 401) {
            console.log('   ✅ SUCCESS: Invalid credentials properly rejected');

            // Check error response structure
            if (result.data.error && result.data.message) {
                console.log('   ✅ SUCCESS: Error response matches Error schema');
            } else {
                console.log('   ❌ FAIL: Error response missing required fields');
                console.log('   Expected: error, message');
                console.log(`   Got: ${Object.keys(result.data).join(', ')}`);
            }
        } else {
            console.log('   ❌ FAIL: Should have rejected invalid credentials');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Logout
    console.log('📝 Test 5: Logout');
    try {
        const result = await makeRequest('POST', `${baseUrl}/logout`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

        if (result.status === 200) {
            console.log('   ✅ SUCCESS: Logout successful');

            // Check if response has message
            if (result.data.message) {
                console.log('   ✅ SUCCESS: Response contains message field');
            } else {
                console.log('   ❌ FAIL: Response missing message field');
                console.log(`   Got: ${Object.keys(result.data).join(', ')}`);
            }
        } else {
            console.log('   ❌ FAIL: Logout failed');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('\n🎯 Test Summary Complete!\n');
    console.log('📋 What to check:');
    console.log('   - All responses should use camelCase (firstName, not first_name)');
    console.log('   - Error responses should have both "error" and "message" fields');
    console.log('   - Success responses should match their OpenAPI schemas exactly');
}

// Run the tests
testAuthEndpoints().catch(console.error);

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:8080/api';
const COOKIE =
    'connect.sid=s%3AFn3UIpZx-vJ6ZjOo8YM6Uy80pWBhQDDi.uZNcF7ljfU7a1vRX8EK2bjLfV%2F%2B4VRgzKQHb%2FKZrLgE'; // You'll need to update this

class TestRunner {
    constructor() {
        this.results = [];
        this.orderId = null; // Will be set from successful order creation
    }

    async runTest(testName, method, path, body = null, expectedStatus = null, cookie = COOKIE) {
        try {
            const url = `${BASE_URL}${path}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (cookie) {
                options.headers['Cookie'] = cookie;
            }

            if (body) {
                options.body = JSON.stringify(body);
            }

            console.log(`\n🧪 Running: ${testName}`);
            console.log(`   ${method} ${url}`);

            const response = await fetch(url, options);
            const responseText = await response.text();
            let responseData;

            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }

            const result = {
                testName,
                method,
                path,
                actualStatus: response.status,
                expectedStatus,
                passed: expectedStatus ? response.status === expectedStatus : true,
                response: responseData,
                headers: Object.fromEntries(response.headers.entries()),
            };

            // Store order ID from successful order creation
            if (response.status === 201 && responseData && responseData.id) {
                this.orderId = responseData.id;
                console.log(`   📝 Captured order ID: ${this.orderId}`);
            }

            this.results.push(result);

            const statusIcon = result.passed ? '✅' : '❌';
            console.log(
                `   ${statusIcon} Status: ${response.status} ${
                    expectedStatus ? `(expected ${expectedStatus})` : ''
                }`
            );

            return result;
        } catch (error) {
            const result = {
                testName,
                method,
                path,
                actualStatus: 'ERROR',
                expectedStatus,
                passed: false,
                error: error.message,
                response: null,
            };

            this.results.push(result);
            console.log(`   ❌ ERROR: ${error.message}`);
            return result;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Order API Test Suite');
        console.log('=====================================');

        // AUTHENTICATION & BASIC TESTS
        await this.runTest('Get all orders (should work)', 'GET', '/order', null, 200);

        // CREATE LIMIT ORDER TESTS
        console.log('\n📋 LIMIT ORDER TESTS');
        await this.runTest(
            'Create valid limit buy order',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.005',
                price: '50000',
            },
            201
        );

        await this.runTest(
            'Create valid limit sell order',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'sell',
                initialQuantity: '0.009',
                price: '45000',
            },
            201
        );

        // GET LIMIT ORDER TESTS
        if (this.orderId) {
            await this.runTest(
                'Get limit order by ID',
                'GET',
                `/order/limit/${this.orderId}`,
                null,
                200
            );
        }

        await this.runTest(
            'Get limit order with invalid ID',
            'GET',
            '/order/limit/invalid',
            null,
            400
        );
        await this.runTest('Get non-existent limit order', 'GET', '/order/limit/99999', null, 404);

        // VALIDATION TESTS
        await this.runTest(
            'Create limit order without price',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.5',
            },
            422
        );

        await this.runTest(
            'Create limit order without quantity',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                price: '50000',
            },
            422
        );

        await this.runTest(
            'Create limit order with negative price',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.5',
                price: '-1000',
            },
            422
        );

        await this.runTest(
            'Create limit order with zero quantity',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0',
                price: '50000',
            },
            422
        );

        await this.runTest(
            'Create limit order with invalid variant',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'invalid',
                initialQuantity: '0.5',
                price: '50000',
            },
            422
        );

        // CREATE MARKET ORDER TESTS
        console.log('\n📋 MARKET ORDER TESTS');
        await this.runTest(
            'Create valid market buy order',
            'POST',
            '/order/market',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.1',
                notionalValue: '5000.00',
            },
            201
        );

        await this.runTest(
            'Create market order missing fields',
            'POST',
            '/order/market',
            {
                orderVariant: 'buy',
            },
            422
        );

        await this.runTest(
            'Create market order without notional value',
            'POST',
            '/order/market',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.1',
            },
            422
        );

        await this.runTest(
            'Create market order with negative notional value',
            'POST',
            '/order/market',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.1',
                notionalValue: '-1000.00',
            },
            422
        );

        // UPDATE TESTS
        console.log('\n📋 UPDATE LIMIT ORDER TESTS');
        if (this.orderId) {
            await this.runTest(
                'Update limit order successfully',
                'PUT',
                `/order/limit/${this.orderId}`,
                {
                    initialQuantity: '0.0075',
                    price: '55000',
                },
                200
            );

            await this.runTest(
                'Update limit order with invalid data',
                'PUT',
                `/order/limit/${this.orderId}`,
                {
                    invalidField: 'value',
                },
                422
            );
        }

        await this.runTest(
            'Update non-existent limit order',
            'PUT',
            '/order/limit/99999',
            {
                price: '55000',
            },
            404
        );

        // DELETE TESTS
        console.log('\n📋 DELETE LIMIT ORDER TESTS');
        if (this.orderId) {
            await this.runTest(
                'Delete limit order successfully',
                'DELETE',
                `/order/limit/${this.orderId}`,
                null,
                200
            );
        }

        await this.runTest(
            'Delete non-existent limit order',
            'DELETE',
            '/order/limit/99999',
            null,
            404
        );
        await this.runTest(
            'Delete with invalid ID format',
            'DELETE',
            '/order/limit/invalid',
            null,
            422
        );

        // AUTHENTICATION TESTS
        console.log('\n📋 AUTHENTICATION TESTS');
        await this.runTest(
            'Create order without auth',
            'POST',
            '/order/limit',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.005',
                price: '50000',
            },
            401,
            ''
        );

        await this.runTest('Get order without auth', 'GET', '/order/limit/1', null, 401, '');

        // EDGE CASE TESTS
        console.log('\n📋 EDGE CASE TESTS');
        await this.runTest(
            'Test old endpoint /order POST (should 404)',
            'POST',
            '/order',
            {
                cryptocurrencyId: 1,
                orderVariant: 'buy',
                initialQuantity: '0.005',
                price: '50000',
            },
            404
        );

        await this.runTest(
            'Market order PUT (should 404)',
            'PUT',
            '/order/market/1',
            {
                notionalValue: '6000.00',
            },
            404
        );
    }

    generateReport() {
        console.log('\n\n📊 TEST RESULTS REPORT');
        console.log('======================');

        const passed = this.results.filter((r) => r.passed).length;
        const failed = this.results.filter((r) => !r.passed).length;
        const total = this.results.length;

        console.log(
            `📈 Overall Results: ${passed}/${total} tests passed (${(
                (passed / total) *
                100
            ).toFixed(1)}%)`
        );
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            console.log('================');
            this.results
                .filter((r) => !r.passed)
                .forEach((result) => {
                    console.log(`\n🔴 ${result.testName}`);
                    console.log(`   Method: ${result.method} ${result.path}`);
                    console.log(
                        `   Expected: ${result.expectedStatus}, Got: ${result.actualStatus}`
                    );
                    if (result.error) {
                        console.log(`   Error: ${result.error}`);
                    } else if (result.response) {
                        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
                    }
                });
        }

        if (passed > 0) {
            console.log('\n✅ PASSED TESTS:');
            console.log('================');
            this.results
                .filter((r) => r.passed)
                .forEach((result) => {
                    console.log(`🟢 ${result.testName} - ${result.actualStatus}`);
                });
        }

        // Save detailed report to file
        fs.writeFileSync('test-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n📄 Detailed report saved to test-report.json');

        return {
            total,
            passed,
            failed,
            percentage: ((passed / total) * 100).toFixed(1),
            results: this.results,
        };
    }
}

// Run tests
const runner = new TestRunner();
runner
    .runAllTests()
    .then(() => {
        const report = runner.generateReport();
        process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });

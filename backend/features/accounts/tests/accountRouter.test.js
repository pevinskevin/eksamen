import { jest } from '@jest/globals';
import requestModule from 'supertest'; // Renamed to avoid conflict if 'request' is used elsewhere
import expressModule from 'express';
import sessionModule from 'express-session';

// Import the router (this will be hoisted after mocks by Jest)
// import accountRouter from '../../controllers/accountRouter'; // Will be imported dynamically later

// Mock AccountService - MOVED TO beforeEach
// const mockAccountService = {
//     getFiatBalance: jest.fn(),
//     getCryptoBalance: jest.fn(),
//     getCryptoHoldingBySymbol: jest.fn(),
// };

// Mock isAuthenticated middleware - THIS IS NOT USED due to ESM mocking issues
// const mockIsAuthenticated = (req, res, next) => { ... };

// Mock modules before importing the router
// IMPORTANT: The path to AccountService and isAuthenticated must be correct relative to accountRouter.js
jest.mock('../AccountService.js', () => ({
    default: jest.fn().mockImplementation(() => mockAccountService),
}));

// Mock AccountRepository if it is directly instantiated in the router or its dependencies are not fully mocked
const mockAccountRepository = jest.fn().mockImplementation(() => ({}));
jest.mock('../AccountRepository.js', () => ({
    default: mockAccountRepository,
}));

// Mock the actual db connection to prevent any real db calls if mocks aren't perfect
jest.mock('../../../database/connection', () => ({
    default: {},
}));

// REMOVING THIS MOCK ATTEMPT
// const express = expressModule; // Assign to clear express name
const express = expressModule; // Assign to clear express name
const session = sessionModule;
const request = requestModule; // Assign to clear request name

let app; // Declare app here, initialize in beforeAll or beforeEach if needed globally for describe block
let mockAccountService; // Declare here, define in beforeEach

describe('Account Router', () => {
    beforeAll(async () => {
        // No app initialization here anymore
        // Original module mocks that don't change per test can stay here if any
        // (AccountRepository, database/connection are fine at top level or here)
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        // Initialize a fresh app for each test
        app = express();
        app.use(express.json());
        app.use(
            session({
                secret: 'test-account-secret',
                resave: false,
                saveUninitialized: true,
                cookie: { secure: false },
            })
        );
        app.use((req, res, next) => {
            if (req.headers['x-test-user-id']) {
                req.session.userId = parseInt(req.headers['x-test-user-id'], 10);
                req.session.role = req.headers['x-test-user-role'] || 'user';
                req.session.save((err) => (err ? next(err) : next()));
            } else {
                next();
            }
        });

        mockAccountService = {
            getFiatBalance: jest.fn(),
            getCryptoBalance: jest.fn(),
            getCryptoHoldingBySymbol: jest.fn(),
        };

        // Replace the module with our mock implementation for each test
        jest.unstable_mockModule('../AccountService.js', () => ({
            default: jest.fn(() => mockAccountService),
        }));

        jest.resetModules(); // Important to ensure the router gets the fresh mock
        const accountRouterModule = await import('../accountRouter.js');
        const accountRouterInstance = accountRouterModule.default;
        app.use('/api/accounts', accountRouterInstance);
    });

    // afterEach might be needed to clean up router if app.use stacks -- less likely now

    describe('GET /api/accounts/balances', () => {
        it('should return fiat and crypto balances successfully', async () => {
            // Adjusted mock values to better match expected real structure
            const fiatBalanceMock = [
                {
                    account_id: 1,
                    user_id: 1,
                    currency_code: 'SIM_USD',
                    balance: '10000.00000000', // Adjusted based on likely actual data
                    created_at: expect.any(String), // Check for string type
                    updated_at: expect.any(String), // Check for string type
                },
            ];
            const cryptoHoldingsMock = [
                {
                    holding_id: 1,
                    user_id: 1,
                    cryptocurrency_id: 1,
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    balance: '1.50000000', // Adjusted based on likely actual data
                    description: 'Simulated Bitcoin',
                    icon_url: null,
                    created_at: expect.any(String), // Check for string type
                    updated_at: expect.any(String), // Check for string type
                },
                {
                    holding_id: 2,
                    user_id: 1,
                    cryptocurrency_id: 2,
                    name: 'Ethereum',
                    symbol: 'ETH',
                    balance: '10.00000000', // Added based on likely actual data
                    description: 'Simulated Ethereum',
                    icon_url: null,
                    created_at: expect.any(String), // Check for string type
                    updated_at: expect.any(String), // Check for string type
                },
                {
                    holding_id: 3,
                    user_id: 1,
                    cryptocurrency_id: 3,
                    name: 'Binance Coin',
                    symbol: 'BNB',
                    balance: '50.00000000', // Added based on likely actual data
                    description: 'Simulated BNB',
                    icon_url: null,
                    created_at: expect.any(String), // Check for string type
                    updated_at: expect.any(String), // Check for string type
                },
            ];
            mockAccountService.getFiatBalance.mockResolvedValue(fiatBalanceMock); // Resolves to an array
            mockAccountService.getCryptoBalance.mockResolvedValue(cryptoHoldingsMock);

            const response = await request(app)
                .get('/api/accounts/balances')
                .set('x-test-user-id', '1'); // Set custom header

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Yay it worked');

            // Check the structure and critical values, then type check dates
            expect(response.body.data.account[0].account_id).toBe(fiatBalanceMock[0].account_id);
            expect(response.body.data.account[0].user_id).toBe(fiatBalanceMock[0].user_id);
            expect(response.body.data.account[0].currency_code).toBe(
                fiatBalanceMock[0].currency_code
            );
            expect(response.body.data.account[0].balance).toBe(fiatBalanceMock[0].balance);
            expect(response.body.data.account[0].created_at).toEqual(expect.any(Object)); // Expecting a generic object
            expect(response.body.data.account[0].updated_at).toEqual(expect.any(Object)); // Expecting a generic object

            expect(response.body.data.holdings.length).toBe(cryptoHoldingsMock.length);
            cryptoHoldingsMock.forEach((mockHolding, index) => {
                const receivedHolding = response.body.data.holdings[index];
                expect(receivedHolding.holding_id).toBe(mockHolding.holding_id);
                expect(receivedHolding.user_id).toBe(mockHolding.user_id);
                expect(receivedHolding.cryptocurrency_id).toBe(mockHolding.cryptocurrency_id);
                expect(receivedHolding.name).toBe(mockHolding.name);
                expect(receivedHolding.symbol).toBe(mockHolding.symbol);
                expect(receivedHolding.balance).toBe(mockHolding.balance);
                expect(receivedHolding.description).toBe(mockHolding.description);
                expect(receivedHolding.icon_url).toBe(mockHolding.icon_url);
                expect(receivedHolding.created_at).toEqual(expect.any(Object)); // Expecting a generic object
                expect(receivedHolding.updated_at).toEqual(expect.any(Object)); // Expecting a generic object
            });

            expect(mockAccountService.getFiatBalance).toHaveBeenCalledWith(1);
            expect(mockAccountService.getCryptoBalance).toHaveBeenCalledWith(1);
        });

        it('should return 404 if fiat balance is not found', async () => {
            const fiatBalanceError = new Error('No Fiat Account registered to user.'); // Exact message
            mockAccountService.getFiatBalance.mockRejectedValue(fiatBalanceError);
            // Ensure the other service call resolves to a valid structure if called
            const cryptoHoldingsMock = [
                {
                    holding_id: 1,
                    user_id: 1,
                    cryptocurrency_id: 1,
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    balance: '0.00000000',
                    description: 'Simulated Bitcoin',
                    icon_url: null,
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                },
            ];
            mockAccountService.getCryptoBalance.mockResolvedValue(cryptoHoldingsMock);

            const response = await request(app)
                .get('/api/accounts/balances')
                .set('x-test-user-id', '1');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(fiatBalanceError.message);
        });

        it('should return 404 if crypto balance is not found', async () => {
            const cryptoBalanceError = new Error('No crypto account registered to user.'); // Exact message
            const fiatBalanceMock = [
                // Should be an array
                {
                    account_id: 1,
                    user_id: 1,
                    currency_code: 'SIM_USD',
                    balance: '10000.00000000', // Consistent with successful mock
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                },
            ];
            mockAccountService.getFiatBalance.mockResolvedValue(fiatBalanceMock);
            mockAccountService.getCryptoBalance.mockRejectedValue(cryptoBalanceError);

            const response = await request(app)
                .get('/api/accounts/balances')
                .set('x-test-user-id', '1');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(cryptoBalanceError.message);
        });

        it('should return 500 for other server errors', async () => {
            const serverError = new Error('Some generic server error'); // Message does NOT match 404 conditions
            mockAccountService.getFiatBalance.mockImplementationOnce(async () => {
                // console.log('DEBUG: mockGetFiatBalance throwing error:', serverError.message); // Keep for debugging if needed
                return Promise.reject(serverError);
            });
            mockAccountService.getCryptoBalance.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/api/accounts/balances')
                .set('x-test-user-id', '1');

            expect(response.status).toBe(500);
            expect(response.body.errorMessage).toBe('Server error while fetching balances.');
        });
    });

    describe('GET /api/accounts/crypto/:symbol', () => {
        const userId = 1; // From mockIsAuthenticated
        const symbol = 'BTC';

        it('should return specific crypto holding successfully', async () => {
            const mockHolding = {
                symbol: symbol,
                balance: '1.50000000', // Adjusted based on likely actual data for BTC
            };
            mockAccountService.getCryptoHoldingBySymbol.mockResolvedValue(mockHolding);

            const response = await request(app)
                .get(`/api/accounts/crypto/${symbol}`)
                .set('x-test-user-id', userId.toString());

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Yay it worked');
            expect(response.body.data).toEqual(mockHolding);
            expect(mockAccountService.getCryptoHoldingBySymbol).toHaveBeenCalledWith(
                userId,
                symbol.toUpperCase()
            );
        });

        it('should return 404 if cryptocurrency symbol is not found', async () => {
            const errorMessage = `Cryptocurrency with symbol '${symbol}' not found.`; // Exact message for "not found"
            mockAccountService.getCryptoHoldingBySymbol.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .get(`/api/accounts/crypto/${symbol}`)
                .set('x-test-user-id', userId.toString());

            expect(response.status).toBe(404);
            expect(response.body.message).toBe(errorMessage);
        });

        it('should return 404 if user has no holdings for the symbol', async () => {
            const errorMessage = `No holdings found for symbol '${symbol}' for this user.`; // Exact message for "no holdings"
            mockAccountService.getCryptoHoldingBySymbol.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .get(`/api/accounts/crypto/${symbol}`)
                .set('x-test-user-id', userId.toString());

            expect(response.status).toBe(404);
            expect(response.body.message).toBe(errorMessage);
        });

        it('should return 500 for other server errors', async () => {
            mockAccountService.getCryptoHoldingBySymbol.mockRejectedValue(
                new Error('Some other DB error') // Message does NOT match 404 conditions
            );

            const response = await request(app)
                .get(`/api/accounts/crypto/${symbol}`)
                .set('x-test-user-id', userId.toString());

            expect(response.status).toBe(500);
            expect(response.body.errorMessage).toBe(
                'Server error while fetching cryptocurrency holding.'
            );
        });
    });

    afterAll(async () => {
        // Dynamically import the original db instance and call .end()
        try {
            const dbModule = await import('../../../database/connection.js');
            if (dbModule.default && typeof dbModule.default.end === 'function') {
                await dbModule.default.end();
            }
        } catch (error) {
            /* ... */
        }
    });
});

import { jest } from '@jest/globals';
import AccountRepository from '../AccountRepository.js';

// Mock the database connection
const mockDb = {
    query: jest.fn(),
};

describe('AccountRepository', () => {
    let accountRepository;

    beforeEach(() => {
        accountRepository = new AccountRepository(mockDb);
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe('readFiatBalance', () => {
        it('should return fiat balance when found', async () => {
            const mockBalance = [
                { account_id: 1, user_id: 1, currency_code: 'USD', balance: 1000 },
            ];
            mockDb.query.mockResolvedValue({ rows: mockBalance });

            const result = await accountRepository.readFiatBalance(1);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
                values: [1],
            });
            expect(result).toEqual(mockBalance);
        });

        it('should return an empty array if no fiat balance found', async () => {
            mockDb.query.mockResolvedValue({ rows: [] });

            const result = await accountRepository.readFiatBalance(1);
            expect(result).toEqual([]);
        });

        it('should throw an error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDb.query.mockRejectedValue(dbError);

            await expect(accountRepository.readFiatBalance(1)).rejects.toThrow(
                'Repository error' + dbError
            );
        });
    });

    describe('readCryptoBalance', () => {
        it('should return crypto balances when found', async () => {
            const mockBalances = [
                { holding_id: 1, user_id: 1, cryptocurrency_id: 10, balance: 2.5, symbol: 'BTC' },
                { holding_id: 2, user_id: 1, cryptocurrency_id: 12, balance: 10, symbol: 'ETH' },
            ];
            mockDb.query.mockResolvedValue({ rows: mockBalances });

            const result = await accountRepository.readCryptoBalance(1);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
                values: [1],
            });
            expect(result).toEqual(mockBalances);
        });

        it('should return an empty array if no crypto balances found', async () => {
            mockDb.query.mockResolvedValue({ rows: [] });
            const result = await accountRepository.readCryptoBalance(1);
            expect(result).toEqual([]);
        });

        // Note: The original readCryptoBalance method has an empty catch block.
        // This test demonstrates that it would return undefined if an error occurs.
        // Ideally, the method should throw or handle the error.
        it('should throw an error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDb.query.mockRejectedValue(dbError);

            await expect(accountRepository.readCryptoBalance(1)).rejects.toThrow(
                'Repository error: Error: Database connection failed'
            );
        });
    });

    describe('readCryptoHoldingBySymbol', () => {
        const userId = 1;
        const symbol = 'BTC';
        const cryptocurrencyId = 101;

        it('should return crypto holding when found', async () => {
            const mockIdResult = { rows: [{ cryptocurrency_id: cryptocurrencyId }] };
            const mockHoldingsResult = { rows: [{ symbol: 'BTC', balance: 0.5 }] };

            mockDb.query
                .mockResolvedValueOnce(mockIdResult) // For idQuery
                .mockResolvedValueOnce(mockHoldingsResult); // For holdingsQuery

            const result = await accountRepository.readCryptoHoldingBySymbol(userId, symbol);

            expect(mockDb.query).toHaveBeenNthCalledWith(1, {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
                values: [symbol],
            });
            expect(mockDb.query).toHaveBeenNthCalledWith(2, {
                text: 'SELECT symbol, balance FROM crypto_holdings WHERE cryptocurrency_id = $1 AND user_id = $2',
                values: [cryptocurrencyId, userId],
            });
            expect(result).toEqual({ symbol: 'BTC', balance: 0.5 });
        });

        it('should return null if cryptocurrency symbol is not found', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [] }); // idQuery finds no symbol

            const result = await accountRepository.readCryptoHoldingBySymbol(userId, 'UNKNOWN');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
                values: ['UNKNOWN'],
            });
            expect(result).toBeNull();
        });

        it('should return an empty array if cryptocurrency is found but user has no holdings for it', async () => {
            const mockIdResult = { rows: [{ cryptocurrency_id: cryptocurrencyId }] };
            mockDb.query
                .mockResolvedValueOnce(mockIdResult) // idQuery
                .mockResolvedValueOnce({ rows: [] }); // holdingsQuery finds no holdings

            const result = await accountRepository.readCryptoHoldingBySymbol(userId, symbol);
            expect(result).toEqual([]);
        });

        it('should throw an error when the first database query (idQuery) fails', async () => {
            const dbError = new Error('DB fail on idQuery');
            mockDb.query.mockRejectedValueOnce(dbError);

            await expect(
                accountRepository.readCryptoHoldingBySymbol(userId, symbol)
            ).rejects.toThrow('Repository error: ' + dbError);
        });

        it('should throw an error when the second database query (holdingsQuery) fails', async () => {
            const mockIdResult = { rows: [{ cryptocurrency_id: cryptocurrencyId }] };
            const dbError = new Error('DB fail on holdingsQuery');

            mockDb.query
                .mockResolvedValueOnce(mockIdResult) // idQuery succeeds
                .mockRejectedValueOnce(dbError); // holdingsQuery fails

            await expect(
                accountRepository.readCryptoHoldingBySymbol(userId, symbol)
            ).rejects.toThrow('Repository error: ' + dbError);
        });
    });
});

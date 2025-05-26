import { jest } from '@jest/globals';
import AccountService from '../AccountService.js';

// Mock AccountRepository
const mockAccountRepository = {
    readFiatBalance: jest.fn(),
    readCryptoBalance: jest.fn(),
    readCryptoHoldingBySymbol: jest.fn(),
};

describe('AccountService', () => {
    let accountService;

    beforeEach(() => {
        accountService = new AccountService(mockAccountRepository);
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe('getFiatBalance', () => {
        it('should return fiat balance when repository returns data', async () => {
            const mockBalance = [{ user_id: 1, balance: 5000 }];
            mockAccountRepository.readFiatBalance.mockResolvedValue(mockBalance);

            const result = await accountService.getFiatBalance(1);

            expect(mockAccountRepository.readFiatBalance).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockBalance);
        });

        it('should throw an error if repository returns no fiat balance (falsy)', async () => {
            mockAccountRepository.readFiatBalance.mockResolvedValue(null); // Or undefined, or [] based on actual repo behavior for "not found"

            await expect(accountService.getFiatBalance(1)).rejects.toThrow(
                'No fiat account registered to user.'
            );
            expect(mockAccountRepository.readFiatBalance).toHaveBeenCalledWith(1);
        });

        it('should re-throw errors from the repository', async () => {
            const repoError = new Error('Repository Error');
            mockAccountRepository.readFiatBalance.mockRejectedValue(repoError);

            await expect(accountService.getFiatBalance(1)).rejects.toThrow(repoError);
        });
    });

    describe('getCryptoBalance', () => {
        it('should return crypto balance when repository returns data', async () => {
            const mockCryptoBalance = [{ symbol: 'BTC', balance: 1.5 }];
            mockAccountRepository.readCryptoBalance.mockResolvedValue(mockCryptoBalance);

            const result = await accountService.getCryptoBalance(1);

            expect(mockAccountRepository.readCryptoBalance).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCryptoBalance);
        });

        it('should throw an error if repository returns no crypto balance (falsy)', async () => {
            mockAccountRepository.readCryptoBalance.mockResolvedValue(null); // Or undefined, or [] based on actual repo behavior for "not found"

            await expect(accountService.getCryptoBalance(1)).rejects.toThrow(
                'No crypto account registered to user.'
            );
            expect(mockAccountRepository.readCryptoBalance).toHaveBeenCalledWith(1);
        });

        it('should re-throw errors from the repository', async () => {
            const repoError = new Error('Repository Error');
            mockAccountRepository.readCryptoBalance.mockRejectedValue(repoError);

            await expect(accountService.getCryptoBalance(1)).rejects.toThrow(repoError);
        });
    });

    describe('getCryptoHoldingBySymbol', () => {
        const userId = 1;
        const symbol = 'ETH';

        it('should return holding when repository returns data', async () => {
            const mockHolding = { symbol: 'ETH', balance: 10 };
            mockAccountRepository.readCryptoHoldingBySymbol.mockResolvedValue(mockHolding);

            const result = await accountService.getCryptoHoldingBySymbol(userId, symbol);

            expect(mockAccountRepository.readCryptoHoldingBySymbol).toHaveBeenCalledWith(
                userId,
                symbol
            );
            expect(result).toEqual(mockHolding);
        });

        it("should throw 'Cryptocurrency ... not found' if repository returns null (symbol not found)", async () => {
            mockAccountRepository.readCryptoHoldingBySymbol.mockResolvedValue(null);

            await expect(accountService.getCryptoHoldingBySymbol(userId, symbol)).rejects.toThrow(
                `Cryptocurrency with symbol '${symbol}' not found.`
            );
            expect(mockAccountRepository.readCryptoHoldingBySymbol).toHaveBeenCalledWith(
                userId,
                symbol
            );
        });

        it("should throw 'No holdings found...' if repository returns an empty array (user has no holdings for symbol)", async () => {
            mockAccountRepository.readCryptoHoldingBySymbol.mockResolvedValue([]);

            await expect(accountService.getCryptoHoldingBySymbol(userId, symbol)).rejects.toThrow(
                `No holdings found for symbol '${symbol}' for this user.`
            );
            expect(mockAccountRepository.readCryptoHoldingBySymbol).toHaveBeenCalledWith(
                userId,
                symbol
            );
        });

        it('should re-throw other errors from the repository', async () => {
            const repoError = new Error('Some Other Repository Error');
            mockAccountRepository.readCryptoHoldingBySymbol.mockRejectedValue(repoError);

            await expect(accountService.getCryptoHoldingBySymbol(userId, symbol)).rejects.toThrow(
                repoError
            );
        });
    });
});

import { jest } from '@jest/globals';
import CryptoService from '../../services/cryptoService.js';

// Mock CryptoRepository
const mockCryptoRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
};

describe('CryptoService', () => {
    let cryptoService;

    beforeEach(() => {
        // Create a new service instance with the mock repository before each test
        cryptoService = new CryptoService(mockCryptoRepository);
        // Clear all mock usage history before each test
        jest.clearAllMocks();
    });

    describe('getAllCryptocurrencies', () => {
        it('should return all cryptocurrencies from the repository', async () => {
            const mockCryptos = [{ id: 1, name: 'Bitcoin' }];
            mockCryptoRepository.findAll.mockResolvedValue(mockCryptos);

            const result = await cryptoService.getAllCryptocurrencies();

            expect(mockCryptoRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockCryptos);
        });

        it('should throw a service error if repository throws an error', async () => {
            const repoError = new Error('DB down');
            mockCryptoRepository.findAll.mockRejectedValue(repoError);

            await expect(cryptoService.getAllCryptocurrencies()).rejects.toThrow(
                'Service error retrieving all cryptocurrencies: ' + repoError.message
            );
        });
    });

    describe('getCryptocurrencyById', () => {
        it('should return the cryptocurrency when found by repository', async () => {
            const mockCrypto = { id: 1, name: 'Bitcoin' };
            // findById in repo returns an array, service expects to get the first element
            mockCryptoRepository.findById.mockResolvedValue([mockCrypto]);

            const result = await cryptoService.getCryptocurrencyById(1);

            expect(mockCryptoRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCrypto);
        });

        it('should throw 404 error if repository returns empty array (crypto not found)', async () => {
            mockCryptoRepository.findById.mockResolvedValue([]); // Not found

            try {
                await cryptoService.getCryptocurrencyById(99);
            } catch (error) {
                expect(error.message).toBe('Cryptocurrency not found');
                expect(error.statusCode).toBe(404);
            }
            expect(mockCryptoRepository.findById).toHaveBeenCalledWith(99);
        });

        it('should throw 404 error if repository returns null (should not happen based on repo code, but good to test)', async () => {
            mockCryptoRepository.findById.mockResolvedValue(null); // Not found

            try {
                await cryptoService.getCryptocurrencyById(99);
            } catch (error) {
                expect(error.message).toBe('Cryptocurrency not found');
                expect(error.statusCode).toBe(404);
            }
            expect(mockCryptoRepository.findById).toHaveBeenCalledWith(99);
        });

        it('should re-throw repository error with status code if present', async () => {
            const repoError = new Error('Repo specific error');
            repoError.statusCode = 403; // Example custom status code from repo
            mockCryptoRepository.findById.mockRejectedValue(repoError);

            try {
                await cryptoService.getCryptocurrencyById(1);
            } catch (error) {
                expect(error).toBe(repoError); // Service should re-throw the exact error
            }
        });

        it('should throw a generic service error if repository throws error without status code', async () => {
            const repoError = new Error('Another DB issue');
            mockCryptoRepository.findById.mockRejectedValue(repoError);

            await expect(cryptoService.getCryptocurrencyById(1)).rejects.toThrow(
                'Service error retrieving cryptocurrency by ID: ' + repoError.message
            );
        });
    });

    describe('createCryptocurrency', () => {
        const cryptoData = {
            symbol: 'DOT',
            name: 'Polkadot',
            description: 'Blockchain interoperability platform',
        };
        const createdCrypto = { ...cryptoData, id: 1 };

        it('should create and return cryptocurrency if data is valid', async () => {
            mockCryptoRepository.create.mockResolvedValue(createdCrypto);

            const result = await cryptoService.createCryptocurrency(cryptoData);

            expect(mockCryptoRepository.create).toHaveBeenCalledWith(cryptoData);
            expect(result).toEqual(createdCrypto);
        });

        it('should throw 400 error if symbol is missing', async () => {
            const invalidData = { name: 'Missing Symbol Coin' };
            try {
                await cryptoService.createCryptocurrency(invalidData);
            } catch (error) {
                expect(error.message).toBe('Symbol and name are required fields');
                expect(error.statusCode).toBe(400);
            }
            expect(mockCryptoRepository.create).not.toHaveBeenCalled();
        });

        it('should throw 400 error if name is missing', async () => {
            const invalidData = { symbol: 'MSN' }; // Missing Name
            try {
                await cryptoService.createCryptocurrency(invalidData);
            } catch (error) {
                expect(error.message).toBe('Symbol and name are required fields');
                expect(error.statusCode).toBe(400);
            }
            expect(mockCryptoRepository.create).not.toHaveBeenCalled();
        });

        it('should throw 500 service error if repository create fails with a generic repo error', async () => {
            const repoError = new Error('Repository error: Unique constraint failed'); // Example of repo error
            mockCryptoRepository.create.mockRejectedValue(repoError);

            try {
                await cryptoService.createCryptocurrency(cryptoData);
            } catch (error) {
                expect(error.message).toBe(
                    'Failed to create cryptocurrency due to a database issue.'
                );
                expect(error.statusCode).toBe(500);
            }
        });

        it('should throw generic service error if repository create fails with a non-repo error', async () => {
            const otherError = new Error('Network timeout');
            mockCryptoRepository.create.mockRejectedValue(otherError);

            await expect(cryptoService.createCryptocurrency(cryptoData)).rejects.toThrow(
                'Service error creating cryptocurrency: ' + otherError.message
            );
        });
    });

    describe('updateCryptocurrency', () => {
        const cryptoId = 1;
        const updateData = { name: 'Bitcoin Cash', symbol: 'BCH' };
        const updatedCrypto = { id: cryptoId, ...updateData };

        it('should update and return cryptocurrency if found and data is valid', async () => {
            mockCryptoRepository.update.mockResolvedValue(updatedCrypto);

            const result = await cryptoService.updateCryptocurrency(cryptoId, updateData);

            expect(mockCryptoRepository.update).toHaveBeenCalledWith(cryptoId, updateData);
            expect(result).toEqual(updatedCrypto);
        });

        it('should throw 404 error if repository returns null (crypto not found for update)', async () => {
            mockCryptoRepository.update.mockResolvedValue(null);

            try {
                await cryptoService.updateCryptocurrency(999, updateData); // Non-existent ID
            } catch (error) {
                expect(error.message).toBe('Cryptocurrency not found for update');
                expect(error.statusCode).toBe(404);
            }
            expect(mockCryptoRepository.update).toHaveBeenCalledWith(999, updateData);
        });

        it('should re-throw repository error with status code if present during update', async () => {
            const repoError = new Error('Repo update error');
            repoError.statusCode = 409; // Conflict example
            mockCryptoRepository.update.mockRejectedValue(repoError);

            try {
                await cryptoService.updateCryptocurrency(cryptoId, updateData);
            } catch (error) {
                expect(error).toBe(repoError);
            }
        });

        it('should throw generic service error if repository update fails without status code', async () => {
            const repoError = new Error('Generic DB update failure');
            mockCryptoRepository.update.mockRejectedValue(repoError);

            await expect(cryptoService.updateCryptocurrency(cryptoId, updateData)).rejects.toThrow(
                'Service error updating cryptocurrency: ' + repoError.message
            );
        });
    });

    describe('deleteCryptocurrency', () => {
        const cryptoId = 1;
        const deletedCrypto = { id: cryptoId, name: 'Bitcoin', symbol: 'BTC' }; // Example of what repo might return

        it('should delete and return cryptocurrency if found', async () => {
            mockCryptoRepository.deleteById.mockResolvedValue(deletedCrypto);

            const result = await cryptoService.deleteCryptocurrency(cryptoId);

            expect(mockCryptoRepository.deleteById).toHaveBeenCalledWith(cryptoId);
            expect(result).toEqual(deletedCrypto);
        });

        it('should throw 404 error if repository returns null (crypto not found for deletion)', async () => {
            mockCryptoRepository.deleteById.mockResolvedValue(null);

            try {
                await cryptoService.deleteCryptocurrency(999); // Non-existent ID
            } catch (error) {
                expect(error.message).toBe('Cryptocurrency not found for deletion');
                expect(error.statusCode).toBe(404);
            }
            expect(mockCryptoRepository.deleteById).toHaveBeenCalledWith(999);
        });

        it('should re-throw repository error with status code if present during deletion', async () => {
            const repoError = new Error('Repo delete error');
            repoError.statusCode = 403; // Forbidden example
            mockCryptoRepository.deleteById.mockRejectedValue(repoError);

            try {
                await cryptoService.deleteCryptocurrency(cryptoId);
            } catch (error) {
                expect(error).toBe(repoError);
            }
        });

        it('should throw generic service error if repository delete fails without status code', async () => {
            const repoError = new Error('Generic DB delete failure');
            mockCryptoRepository.deleteById.mockRejectedValue(repoError);

            await expect(cryptoService.deleteCryptocurrency(cryptoId)).rejects.toThrow(
                'Service error deleting cryptocurrency: ' + repoError.message
            );
        });
    });
});

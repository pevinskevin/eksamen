import { jest } from '@jest/globals';
import CryptoRepository from '../../repositories/CryptoRepository.js';

// Mock the database connection
const mockDb = {
    query: jest.fn(),
};

describe('CryptoRepository', () => {
    let cryptoRepository;

    beforeEach(() => {
        // Create a new repository instance with the mock DB before each test
        cryptoRepository = new CryptoRepository(mockDb);
        // Clear all mock usage history before each test
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all cryptocurrencies when found', async () => {
            const mockCryptos = [
                { cryptocurrency_id: 1, symbol: 'BTC', name: 'Bitcoin' },
                { cryptocurrency_id: 2, symbol: 'ETH', name: 'Ethereum' },
            ];
            mockDb.query.mockResolvedValue({ rows: mockCryptos });

            const result = await cryptoRepository.findAll();

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies',
            });
            expect(result).toEqual(mockCryptos);
        });

        it('should return an empty array if no cryptocurrencies are found', async () => {
            mockDb.query.mockResolvedValue({ rows: [] });

            const result = await cryptoRepository.findAll();

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies',
            });
            expect(result).toEqual([]);
        });

        it('should throw an error when the database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDb.query.mockRejectedValue(dbError);

            // Expect the repository method to throw an error
            await expect(cryptoRepository.findAll()).rejects.toThrow('Repository error:' + dbError);
            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies',
            });
        });
    });

    describe('findById', () => {
        it('should return the cryptocurrency when found by ID', async () => {
            const mockCrypto = [{ cryptocurrency_id: 1, symbol: 'BTC', name: 'Bitcoin' }];
            mockDb.query.mockResolvedValue({ rows: mockCrypto });

            const result = await cryptoRepository.findById(1);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [1],
            });
            expect(result).toEqual(mockCrypto);
        });

        it('should return an empty array if no cryptocurrency is found by ID', async () => {
            mockDb.query.mockResolvedValue({ rows: [] });

            const result = await cryptoRepository.findById(999); // Non-existent ID

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [999],
            });
            expect(result).toEqual([]);
        });

        it('should throw an error when the database query fails for findById', async () => {
            const dbError = new Error('DB query failed for findById');
            mockDb.query.mockRejectedValue(dbError);

            await expect(cryptoRepository.findById(1)).rejects.toThrow(
                'Repository error:' + dbError
            );
            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [1],
            });
        });
    });

    describe('create', () => {
        const newCryptoData = {
            symbol: 'ADA',
            name: 'Cardano',
            description: 'A proof-of-stake blockchain platform.',
            icon_url: 'ada.png',
        };
        const expectedCreatedCrypto = { ...newCryptoData, cryptocurrency_id: 3 };

        it('should create a new cryptocurrency and return it', async () => {
            mockDb.query.mockResolvedValue({ rows: [expectedCreatedCrypto] });

            const result = await cryptoRepository.create(newCryptoData);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
                values: [
                    newCryptoData.symbol,
                    newCryptoData.name,
                    newCryptoData.description,
                    newCryptoData.icon_url,
                ],
            });
            expect(result).toEqual(expectedCreatedCrypto);
        });

        it('should handle null for optional fields (description, icon_url)', async () => {
            const minimalData = { symbol: 'SOL', name: 'Solana' };
            const expectedMinimalCrypto = {
                ...minimalData,
                cryptocurrency_id: 4,
                description: null,
                icon_url: null,
            }; // Assuming DB defaults or repo handles nulls
            mockDb.query.mockResolvedValue({ rows: [expectedMinimalCrypto] });

            const result = await cryptoRepository.create(minimalData);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
                values: [minimalData.symbol, minimalData.name, null, null],
            });
            expect(result).toEqual(expectedMinimalCrypto);
        });

        it('should throw an error if database query fails during creation', async () => {
            const dbError = new Error('DB insert failed');
            mockDb.query.mockRejectedValue(dbError);

            await expect(cryptoRepository.create(newCryptoData)).rejects.toThrow(
                'Repository error creating cryptocurrency: ' + dbError.message
            );
            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
                values: [
                    newCryptoData.symbol,
                    newCryptoData.name,
                    newCryptoData.description,
                    newCryptoData.icon_url,
                ],
            });
        });
    });

    describe('update', () => {
        const cryptoIdToUpdate = 1;
        const updateData = { name: 'Bitcoin Updated', description: 'Digital Gold Updated' };
        const originalCrypto = {
            cryptocurrency_id: cryptoIdToUpdate,
            symbol: 'BTC',
            name: 'Bitcoin',
            description: 'Digital Gold',
            icon_url: 'btc.png',
        };
        const expectedUpdatedCrypto = { ...originalCrypto, ...updateData };

        it('should update an existing cryptocurrency and return it', async () => {
            // Mock for the initial checkQuery
            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] });
            // Mock for the actual update query
            mockDb.query.mockResolvedValueOnce({ rows: [expectedUpdatedCrypto] });

            const result = await cryptoRepository.update(cryptoIdToUpdate, updateData);

            expect(mockDb.query).toHaveBeenNthCalledWith(1, {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [cryptoIdToUpdate],
            });
            expect(mockDb.query).toHaveBeenNthCalledWith(2, {
                text: 'UPDATE cryptocurrencies SET symbol = COALESCE($2, symbol), name = COALESCE($3, name), description = COALESCE($4, description), icon_url = COALESCE($5, icon_url) WHERE cryptocurrency_id = $1 RETURNING *',
                values: [
                    cryptoIdToUpdate,
                    updateData.symbol,
                    updateData.name,
                    updateData.description,
                    updateData.icon_url,
                ],
            });
            expect(result).toEqual(expectedUpdatedCrypto);
        });

        it('should only update provided fields using COALESCE', async () => {
            const partialUpdateData = { name: 'Bitcoin Super Updated' };
            const expectedPartiallyUpdatedCrypto = {
                ...originalCrypto,
                name: 'Bitcoin Super Updated',
            }; // Symbol, description, icon_url remain original

            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] }); // checkQuery
            mockDb.query.mockResolvedValueOnce({ rows: [expectedPartiallyUpdatedCrypto] }); // update query

            const result = await cryptoRepository.update(cryptoIdToUpdate, partialUpdateData);

            expect(mockDb.query.mock.calls[1][0].values).toEqual([
                cryptoIdToUpdate,
                undefined, // Symbol not provided
                partialUpdateData.name,
                undefined, // Description not provided
                undefined, // Icon_url not provided
            ]);
            expect(result).toEqual(expectedPartiallyUpdatedCrypto);
        });

        it('should return null if cryptocurrency to update is not found', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [] }); // checkQuery finds nothing

            const result = await cryptoRepository.update(999, updateData);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [999],
            });
            expect(result).toBeNull();
            expect(mockDb.query.mock.calls.length).toBe(1); // Ensure update query was not called
        });

        it('should throw an error if database query fails during update check', async () => {
            const dbError = new Error('DB select failed for update check');
            mockDb.query.mockRejectedValueOnce(dbError); // Error on the first (check) query

            await expect(cryptoRepository.update(cryptoIdToUpdate, updateData)).rejects.toThrow(
                'Repository error updating cryptocurrency: ' + dbError.message
            );
        });

        it('should throw an error if database query fails during actual update', async () => {
            const dbError = new Error('DB update failed');
            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] }); // checkQuery succeeds
            mockDb.query.mockRejectedValueOnce(dbError); // Error on the second (update) query

            await expect(cryptoRepository.update(cryptoIdToUpdate, updateData)).rejects.toThrow(
                'Repository error updating cryptocurrency: ' + dbError.message
            );
        });
    });

    describe('deleteById', () => {
        const cryptoIdToDelete = 1;
        const originalCrypto = {
            cryptocurrency_id: cryptoIdToDelete,
            symbol: 'BTC',
            name: 'Bitcoin',
            description: 'Digital Gold',
            icon_url: 'btc.png',
        };

        it('should delete an existing cryptocurrency and return it', async () => {
            // Mock for the initial checkQuery
            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] });
            // Mock for the actual delete query
            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] }); // RETURNING * returns the deleted row

            const result = await cryptoRepository.deleteById(cryptoIdToDelete);

            expect(mockDb.query).toHaveBeenNthCalledWith(1, {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [cryptoIdToDelete],
            });
            expect(mockDb.query).toHaveBeenNthCalledWith(2, {
                text: 'DELETE FROM cryptocurrencies WHERE cryptocurrency_id = $1 RETURNING *',
                values: [cryptoIdToDelete],
            });
            expect(result).toEqual(originalCrypto);
        });

        it('should return null if cryptocurrency to delete is not found', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [] }); // checkQuery finds nothing

            const result = await cryptoRepository.deleteById(999);

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [999],
            });
            expect(result).toBeNull();
            expect(mockDb.query.mock.calls.length).toBe(1); // Ensure delete query was not called
        });

        it('should throw an error if database query fails during delete check', async () => {
            const dbError = new Error('DB select failed for delete check');
            mockDb.query.mockRejectedValueOnce(dbError); // Error on the first (check) query

            await expect(cryptoRepository.deleteById(cryptoIdToDelete)).rejects.toThrow(
                'Repository error deleting cryptocurrency: ' + dbError.message
            );
        });

        it('should throw an error if database query fails during actual deletion', async () => {
            const dbError = new Error('DB delete failed');
            mockDb.query.mockResolvedValueOnce({ rows: [originalCrypto] }); // checkQuery succeeds
            mockDb.query.mockRejectedValueOnce(dbError); // Error on the second (delete) query

            await expect(cryptoRepository.deleteById(cryptoIdToDelete)).rejects.toThrow(
                'Repository error deleting cryptocurrency: ' + dbError.message
            );
        });
    });
});

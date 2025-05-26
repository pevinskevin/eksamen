import { jest } from '@jest/globals';
import UserRepository from '../UserRepository.js'; // Adjusted import

// Mock the database connection
const mockDb = {
    query: jest.fn(),
};

describe('UserRepository', () => {
    // Adjusted describe
    let userRepository; // Adjusted variable name

    beforeEach(() => {
        userRepository = new UserRepository(mockDb); // Adjusted instantiation
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new user successfully', async () => {
            const mockResult = { rows: [], rowCount: 1 };
            mockDb.query.mockResolvedValue(mockResult);

            const result = await userRepository.create('test@example.com', 'hashedpassword'); // Adjusted variable

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                values: ['test@example.com', 'hashedpassword', 'user'],
            });
            expect(result).toEqual(mockResult);
        });

        it('should throw error when database query fails for create', async () => {
            // Adjusted error message expectation
            const dbError = new Error('Email already exists');
            mockDb.query.mockRejectedValue(dbError);

            await expect(
                userRepository.create('existing@example.com', 'hashedpassword') // Adjusted variable
            ).rejects.toThrow('userRepository error:Error: Email already exists');
        });
    });

    describe('seedUserFiatAccount', () => {
        it('should create a fiat account for user successfully', async () => {
            const mockResult = { rows: [], rowCount: 1 };
            mockDb.query.mockResolvedValue(mockResult);

            await userRepository.seedUserFiatAccount('test@example.com'); // Adjusted variable

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
                values: ['SIM_USD', 10000.0, 'test@example.com'],
            });
        });

        it('should throw error when database query fails for seedUserFiatAccount', async () => {
            // Adjusted error message expectation
            const dbError = new Error('User not found for account creation');
            mockDb.query.mockRejectedValue(dbError);

            await expect(
                userRepository.seedUserFiatAccount('nonexistent@example.com') // Adjusted variable
            ).rejects.toThrow('userRepository error:Error: User not found for account creation');
        });
    });
});

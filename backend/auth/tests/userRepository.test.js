import { jest } from '@jest/globals';
import UserRepository from '../../repositories/userRepository.js';

// Mock the database connection
const mockDb = {
    query: jest.fn(),
};

describe('UserRepository', () => {
    let userRepository;

    beforeEach(() => {
        userRepository = new UserRepository(mockDb);
        jest.clearAllMocks();
    });

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                password_hash: 'hashedpassword',
                role: 'user',
            };

            mockDb.query.mockResolvedValue({
                rows: [mockUser],
            });

            const result = await userRepository.findByEmail('test@example.com');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM users where email = $1',
                values: ['test@example.com'],
            });
            expect(result).toEqual(mockUser);
        });

        it('should return undefined when user not found', async () => {
            mockDb.query.mockResolvedValue({
                rows: [],
            });

            const result = await userRepository.findByEmail('nonexistent@example.com');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM users where email = $1',
                values: ['nonexistent@example.com'],
            });
            expect(result).toBeUndefined();
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDb.query.mockRejectedValue(dbError);

            await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow(
                'userRepository error:Error: Database connection failed'
            );
        });
    });

    describe('create', () => {
        it('should create a new user successfully', async () => {
            const mockResult = { rows: [], rowCount: 1 };
            mockDb.query.mockResolvedValue(mockResult);

            const result = await userRepository.create('test@example.com', 'hashedpassword');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                values: ['test@example.com', 'hashedpassword', 'user'],
            });
            expect(result).toEqual(mockResult);
        });

        it('should handle database errors during user creation', async () => {
            const dbError = new Error('Email already exists');
            mockDb.query.mockRejectedValue(dbError);

            await expect(
                userRepository.create('existing@example.com', 'hashedpassword')
            ).rejects.toThrow('Email already exists');
        });
    });

    describe('seedUserFiatAccount', () => {
        it('should create a fiat account for user successfully', async () => {
            const mockResult = { rows: [], rowCount: 1 };
            mockDb.query.mockResolvedValue(mockResult);

            await userRepository.seedUserFiatAccount('test@example.com');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
                values: ['SIM_USD', 10000.0, 'test@example.com'],
            });
        });

        it('should handle database errors during account seeding', async () => {
            const dbError = new Error('User not found for account creation');
            mockDb.query.mockRejectedValue(dbError);

            await expect(
                userRepository.seedUserFiatAccount('nonexistent@example.com')
            ).rejects.toThrow('User not found for account creation');
        });
    });
});

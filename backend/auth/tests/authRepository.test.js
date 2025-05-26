import { jest } from '@jest/globals';
import AuthRepository from '../AuthRepository.js';

// Mock the database connection
const mockDb = {
    query: jest.fn(),
};

describe('AuthRepository', () => {
    let authRepository;

    beforeEach(() => {
        authRepository = new AuthRepository(mockDb);
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

            const result = await authRepository.findByEmail('test@example.com');

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

            const result = await authRepository.findByEmail('nonexistent@example.com');

            expect(mockDb.query).toHaveBeenCalledWith({
                text: 'SELECT * FROM users where email = $1',
                values: ['nonexistent@example.com'],
            });
            expect(result).toBeUndefined();
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDb.query.mockRejectedValue(dbError);

            await expect(authRepository.findByEmail('test@example.com')).rejects.toThrow(
                'authRepository error:Error: Database connection failed'
            );
        });
    });
});

import { jest } from '@jest/globals';

// Create mock functions first
const mockComparePassword = jest.fn();

// Mock the modules before importing them
jest.unstable_mockModule('../../../shared/utils/hashing.js', () => ({
    comparePassword: mockComparePassword,
}));

// Now import the module under test
const { default: AuthService } = await import('../AuthService.js');

const mockAuthRepository = {
    findByEmail: jest.fn(),
};

describe('AuthService', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService(mockAuthRepository);
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should login user successfully with correct credentials', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                password_hash: 'hashedpassword',
                role: 'user',
            };

            mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(true);

            const result = await authService.login('test@example.com', 'password123');

            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(mockComparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(result).toEqual(mockUser);
        });

        it('should throw error when user not found', async () => {
            mockAuthRepository.findByEmail.mockResolvedValue(null);

            await expect(
                authService.login('nonexistent@example.com', 'password123')
            ).rejects.toThrow('User not found.');

            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
            expect(mockComparePassword).not.toHaveBeenCalled();
        });

        it('should throw error when password is incorrect', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                password_hash: 'hashedpassword',
                role: 'user',
            };

            mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
            mockComparePassword.mockResolvedValue(false);

            await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Provided password is incorrect.'
            );

            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(mockComparePassword).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
        });

        it('should handle repository errors during login', async () => {
            const repositoryError = new Error('Database connection failed');
            mockAuthRepository.findByEmail.mockRejectedValue(repositoryError);

            await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
                'Service error:Error: Database connection failed' // Adjusted to match current AuthService error handling
            );
        });
    });
});

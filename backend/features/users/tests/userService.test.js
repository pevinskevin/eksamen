import { jest } from '@jest/globals';

// Create mock functions first
const mockHashPassword = jest.fn();
const mockWelcomeNewUser = jest.fn();

// Mock the modules before importing them
jest.unstable_mockModule('../../../util/hashing.js', () => ({
    hashPassword: mockHashPassword,
    // comparePassword is not needed for these tests
}));

jest.unstable_mockModule('../../../nodemailer/nodemailer.js', () => ({
    welcomeNewUser: mockWelcomeNewUser,
}));

// Now import the module under test
const { default: UserService } = await import('../UserService.js'); // Adjusted import

const mockUserRepository = {
    // Adjusted name
    create: jest.fn(),
    seedUserFiatAccount: jest.fn(),
};

describe('UserService', () => {
    // Adjusted describe
    let userService; // Adjusted variable name

    beforeEach(() => {
        userService = new UserService(mockUserRepository); // Adjusted instantiation
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register user successfully', async () => {
            const mockNewUser = { user_id: 1, email: 'newuser@example.com' };

            mockHashPassword.mockResolvedValue('hashedpassword123');
            mockUserRepository.create.mockResolvedValue(mockNewUser);
            mockUserRepository.seedUserFiatAccount.mockResolvedValue();
            mockWelcomeNewUser.mockResolvedValue({ messageId: 'test123' });

            const result = await userService.register('newuser@example.com', 'password123');

            expect(mockHashPassword).toHaveBeenCalledWith('password123');
            expect(mockUserRepository.create).toHaveBeenCalledWith(
                'newuser@example.com',
                'hashedpassword123'
            );
            expect(mockUserRepository.seedUserFiatAccount).toHaveBeenCalledWith(
                'newuser@example.com'
            );
            expect(mockWelcomeNewUser).toHaveBeenCalledWith('newuser@example.com', 'Test-user');
            expect(result).toEqual(mockNewUser);
        });

        it('should handle password hashing errors', async () => {
            const hashingError = new Error('Hashing failed');
            mockHashPassword.mockRejectedValue(hashingError);

            await expect(
                userService.register('newuser@example.com', 'password123')
            ).rejects.toThrow('register() error:Error: Hashing failed');

            expect(mockHashPassword).toHaveBeenCalledWith('password123');
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });

        it('should handle repository creation errors', async () => {
            const repositoryError = new Error('Email already exists');

            mockHashPassword.mockResolvedValue('hashedpassword123');
            mockUserRepository.create.mockRejectedValue(repositoryError);

            await expect(
                userService.register('existing@example.com', 'password123')
            ).rejects.toThrow('register() error:Error: Email already exists');

            expect(mockHashPassword).toHaveBeenCalledWith('password123');
            expect(mockUserRepository.create).toHaveBeenCalledWith(
                'existing@example.com',
                'hashedpassword123'
            );
            expect(mockUserRepository.seedUserFiatAccount).not.toHaveBeenCalled();
        });

        it('should handle account seeding errors', async () => {
            const mockNewUser = { user_id: 1, email: 'newuser@example.com' };
            const specificSeedingError = new Error('Account seeding failed');

            mockHashPassword.mockResolvedValue('hashedpassword123');
            mockUserRepository.create.mockResolvedValue(mockNewUser);
            mockUserRepository.seedUserFiatAccount.mockImplementationOnce(async () => {
                throw specificSeedingError;
            });

            try {
                await userService.register('newuser@example.com', 'password123');
                throw new Error('userService.register should have thrown an error'); // Adjusted service name
            } catch (error) {
                expect(error.message).toBe('register() error:Error: Account seeding failed');
            }

            expect(mockUserRepository.seedUserFiatAccount).toHaveBeenCalledWith(
                'newuser@example.com'
            );
            expect(mockWelcomeNewUser).not.toHaveBeenCalled();
        });

        it('should handle email sending errors', async () => {
            const mockNewUser = { user_id: 1, email: 'newuser@example.com' };
            const emailError = new Error('Email sending failed');

            mockHashPassword.mockResolvedValue('hashedpassword123');
            mockUserRepository.create.mockResolvedValue(mockNewUser);
            mockUserRepository.seedUserFiatAccount.mockResolvedValue();
            mockWelcomeNewUser.mockRejectedValue(emailError);

            await expect(
                userService.register('newuser@example.com', 'password123')
            ).rejects.toThrow('register() error:Error: Email sending failed');

            expect(mockWelcomeNewUser).toHaveBeenCalledWith('newuser@example.com', 'Test-user');
        });
    });
});

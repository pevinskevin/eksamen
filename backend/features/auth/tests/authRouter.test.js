import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';

// Create mock classes
const mockAuthRepository = jest.fn().mockImplementation(() => ({}));
const mockAuthService = {
    login: jest.fn(),
    // register: jest.fn(), // Removed as register is no longer in AuthService
};

// Mock modules before importing
jest.unstable_mockModule('../AuthService.js', () => ({
    default: jest.fn().mockImplementation(() => mockAuthService),
}));

jest.unstable_mockModule('../../../database/connection.js', () => ({
    default: {},
}));

jest.unstable_mockModule('../AuthRepository.js', () => ({
    default: mockAuthRepository,
}));

// Import the router after mocking
const { default: authRouter } = await import('../authRouter.js');

const app = express();

// Setup middleware for testing
app.use(express.json());
app.use(
    session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);
app.use('/api/auth', authRouter);

describe('Auth Router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should login user successfully and set session', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                role: 'user',
            };

            mockAuthService.login.mockResolvedValue(mockUser);

            const response = await request(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                data: {
                    user: {
                        userId: 1,
                        email: 'test@example.com',
                        role: 'user',
                    },
                },
                message: 'Login successful.',
            });
            expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        it('should return 404 when user not found', async () => {
            mockAuthService.login.mockRejectedValue(new Error('User not found.'));

            const response = await request(app).post('/api/auth/login').send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'User not found.',
            });
        });

        it('should return 404 when password is incorrect', async () => {
            mockAuthService.login.mockRejectedValue(new Error('Provided password is incorrect.'));

            const response = await request(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Provided password is incorrect.',
            });
        });

        it('should return 500 for server errors', async () => {
            mockAuthService.login.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Server error.',
            });
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout user successfully when logged in', async () => {
            const agent = request.agent(app);

            // First login to establish session
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                role: 'user',
            };
            mockAuthService.login.mockResolvedValue(mockUser);

            await agent.post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            // Then logout
            const response = await agent.post('/api/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'User successfully logged out.',
            });
        });

        it('should return 401 when user is not logged in', async () => {
            const response = await request(app).post('/api/auth/logout');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'User is not logged in.',
            });
        });
    });
});

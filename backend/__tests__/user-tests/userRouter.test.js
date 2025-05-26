import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';

// Create mock classes
const mockUserRepository = jest.fn().mockImplementation(() => ({}));
const mockUserService = {
    login: jest.fn(),
    register: jest.fn(),
};

// Mock modules before importing
jest.unstable_mockModule('../../services/userService.js', () => ({
    default: jest.fn().mockImplementation(() => mockUserService),
}));

jest.unstable_mockModule('../../database/connection.js', () => ({
    default: {},
}));

jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
    default: mockUserRepository,
}));

// Import the router after mocking
const { default: userRouter } = await import('../../controllers/userRouter.js');

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
app.use('/api/users', userRouter);

describe('User Router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/users/login', () => {
        it('should login user successfully and set session', async () => {
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                role: 'user',
            };

            mockUserService.login.mockResolvedValue(mockUser);

            const response = await request(app).post('/api/users/login').send({
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
            expect(mockUserService.login).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        it('should return 404 when user not found', async () => {
            mockUserService.login.mockRejectedValue(new Error('User not found.'));

            const response = await request(app).post('/api/users/login').send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'User not found.',
            });
        });

        it('should return 404 when password is incorrect', async () => {
            mockUserService.login.mockRejectedValue(new Error('Provided password is incorrect.'));

            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Provided password is incorrect.',
            });
        });

        it('should return 500 for server errors', async () => {
            mockUserService.login.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Server error.',
            });
        });
    });

    describe('POST /api/users/logout', () => {
        it('should logout user successfully when logged in', async () => {
            const agent = request.agent(app);

            // First login to establish session
            const mockUser = {
                user_id: 1,
                email: 'test@example.com',
                role: 'user',
            };
            mockUserService.login.mockResolvedValue(mockUser);

            await agent.post('/api/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            // Then logout
            const response = await agent.post('/api/users/logout');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'User successfully logged out.',
            });
        });

        it('should return 401 when user is not logged in', async () => {
            const response = await request(app).post('/api/users/logout');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'User is not logged in.',
            });
        });
    });

    describe('POST /api/users/register', () => {
        it('should register user successfully', async () => {
            const mockNewUser = { user_id: 1, email: 'newuser@example.com' };
            mockUserService.register.mockResolvedValue(mockNewUser);

            const response = await request(app).post('/api/users/register').send({
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('User successfully registered.');
            expect(mockUserService.register).toHaveBeenCalledWith(
                'newuser@example.com',
                'password123'
            );
        });

        it('should return 404 when email is missing', async () => {
            const response = await request(app).post('/api/users/register').send({
                email: '',
                password: 'password123',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Error: Username or password is missing.',
            });
            expect(mockUserService.register).not.toHaveBeenCalled();
        });

        it('should return 404 when password is missing', async () => {
            const response = await request(app).post('/api/users/register').send({
                email: 'test@example.com',
                password: '',
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Error: Username or password is missing.',
            });
            expect(mockUserService.register).not.toHaveBeenCalled();
        });

        it('should return 500 for server errors during registration', async () => {
            mockUserService.register.mockRejectedValue(new Error('Email already exists'));

            const response = await request(app).post('/api/users/register').send({
                email: 'existing@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(500);
            expect(response.body.message).toContain('Server error:');
        });
    });
});

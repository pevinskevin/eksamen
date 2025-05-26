import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session'; // Assuming session might be used indirectly or for consistency

// Create mock classes
const mockUserService = {
    // Renamed and simplified
    register: jest.fn(),
};

// Mock modules before importing
jest.unstable_mockModule('../UserService.js', () => ({
    // Path to UserService
    default: jest.fn().mockImplementation(() => mockUserService),
}));

jest.unstable_mockModule('../../../database/connection.js', () => ({
    // Keep db mock if controller uses it directly or via repo
    default: {},
}));

// Import the router after mocking
const { default: userRouter } = await import('../userRouter.js'); // Path to userRouter

const app = express();

// Setup middleware for testing
app.use(express.json());
app.use(
    session({
        // Keep session if userController interacts with it
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);
app.use('/api/users', userRouter); // Base path for userController routes

describe('User Router', () => {
    // Renamed for clarity
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/users/register', () => {
        // Updated endpoint path
        it('should register user successfully', async () => {
            const mockNewUser = { user_id: 1, email: 'newuser@example.com' }; // Example user object
            mockUserService.register.mockResolvedValue(mockNewUser);

            const response = await request(app).post('/api/users/register').send({
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            //toContain used because the actual response concatenates a string with the user object
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
            expect(response.body.message).toContain('Server error:'); // Adjusted to toContain due to error object concatenation
        });
    });
});

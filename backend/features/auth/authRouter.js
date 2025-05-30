import { Router } from 'express';
const router = Router();

import { authService } from '../../shared/factory/factory.js';
import {
    sendSuccess,
    sendError,
    sendCreated,
    sendNotFound,
    sendBadRequest,
    sendUnauthorized,
    sendForbidden,
    sendConflict,
    sendUnprocessableEntity,
} from '../../shared/utils/responseHelpers.js';

router.post('/register', async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await authService.register(userData);
        return sendCreated(res, newUser);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return sendConflict(res, 'Email already registered');
        }
        if (error.name === 'ValiError') {
            // Valibot validation error
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        console.error('Registration error:', error);
        return sendError(res, error, 500);
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authService.login(email, password);

        // Set session data
        req.session.userId = user.id;
        req.session.role = user.role;

        return sendSuccess(res, user);
    } catch (error) {
        if (error.message === 'Invalid credentials') {
            return sendUnauthorized(res, 'Invalid credentials');
        }
        if (error.name === 'ValiError') {
            // Valibot validation error
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendBadRequest(res, validationMessage);
        }
        console.error('Login error:', error);
        return sendError(res, error, 500);
    }
});

router.post('/logout', async (req, res) => {
    try {
        if (!req.session.userId) {
            return sendBadRequest(res, 'User not logged in');
        }
        req.session.destroy();
        return sendSuccess(res, { message: 'Successfully logged out' });
    } catch (error) {
        console.error('Logout error:', error);
        return sendError(res, error, 500);
    }
});

export default router;

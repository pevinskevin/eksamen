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
} from '../../shared/utils/responseHelpers.js';

router.post('/register', async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await authService.register(userData);
        return sendCreated(res, newUser);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return sendBadRequest(res, 'Email already registered');
        }
        if (error.name === 'ValiError') {
            // Valibot validation error
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendBadRequest(res, validationMessage);
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
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return sendError(res, err, 500);
            }

            // Clear the session cookie
            res.clearCookie('connect.sid');

            return sendSuccess(res, { message: 'Successfully logged out' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        return sendError(res, error, 500);
    }
});

export default router;

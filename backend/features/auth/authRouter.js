import { Router } from 'express';
const router = Router();
import { authService } from '../../shared/factory/factory.js';
import {
    sendSuccess,
    sendCreated,
    sendBadRequest,
    sendUnauthorized,
    sendConflict,
    sendUnprocessableEntity,
    sendInternalServerError,
    sendNotFound,
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
        // Validation errors: missing fields, invalid email format, password mismatch, weak password
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
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
        // Validation errors: missing email/password, invalid email format
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        } else return sendInternalServerError(res, error.message);
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
        return sendInternalServerError(res, error.message);
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const newPassword = await authService.resetPassword(req.body.email);
        return sendSuccess(res, newPassword);
    } catch (error) {
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        if (error.message.includes('No account registered to email: ')) {
            return sendNotFound(res, error.message);
        } else {
            return sendInternalServerError(res, error.message);
        }
    }
});

export default router;

import { Router } from 'express';
const router = Router();

import { authService } from '../../shared/factory/factory.js';

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, repeatPassword } = req.body;

        const user = await authService.register(
            firstName,
            lastName,
            email,
            password,
            repeatPassword
        );

        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Passwords do not match') {
            res.status(400).json({
                error: 'Passwords do not match',
            });
        } else if (error.code === '23505') {
            // PostgreSQL unique violation
            res.status(400).json({
                error: 'Email already exists',
            });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Server error during registration',
            });
        }
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await authService.login(req.body.email, req.body.password);
        req.session.role = user.role;
        req.session.userId = user.id;
        res.status(200).json(user);
    } catch (error) {
        if (
            error.message === 'User not found.' ||
            error.message === 'Provided password is incorrect.'
        )
            res.status(401).json({
                error: 'Invalid credentials.',
            });
        else {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Server error during login',
            });
        }
    }
});

router.post('/logout', async (req, res) => {
    try {
        if (!req.session.role) {
            return res.status(401).json({
                error: 'User is not logged in.',
            });
        } else {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({
                        error: 'Could not log out due to server error.',
                    });
                }
            });
            return res.status(200).json({
                message: 'Successfully logged out',
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Server error during logout',
        });
    }
});

export default router;

import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import { login, logout, register } from '../services/authService.js';

router.post('/login', async (req, res) => {
    try {
        const user = await login(req.body, db);
        req.session.role = user.role;
        req.session.userId = user.user_id;
        res.status(200).send({
            data: {
                user: { userId: user.user_id, email: user.email, role: user.role },
            },
            message: 'Login successful.',
        });
    } catch (error) {
        if (
            error.message === 'User not found.' ||
            error.message === 'Provided password is incorrect.'
        )
            res.status(404).send({
                error: error.message,
            });
        else res.status(500).send({ message: 'Server error.' });
    }
});

router.post('/logout', async (req, res) => {
    try {
        await logout(req, res, db);
    } catch (error) {}
});

router.post('/register', async (req, res) => {
    try {
        await register(req, res, db);
    } catch (error) {}
});

export default router;

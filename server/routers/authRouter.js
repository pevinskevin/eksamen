import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import { login, register } from '../services/authService.js';

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
        if (!req.session.role) {
            return res.status(401).send({ error: 'User is not logged in.' });
        } else {
            req.session.destroy((err) => {
                if (err) {
                    return res
                        .status(500)
                        .send({ error: 'Could not log out due to server error.' });
                }
            });
            return res.status(200).send({ message: 'User successfully logged out.' });
        }
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send({ message: `Server error: ${error}` });
    }
});

router.post('/register', async (req, res) => {
    try {
        if (req.body.email === '' || req.body.password === '')
            return res.status(404).send({ error: 'Error: Username or password is missing.' });
        await register(req.body, db);
        return res.status(200).send({ message: 'User successfully registered.' });
    } catch (error) {
        console.log('Server error', error);
        res.status(500).send({ message: `Server error: ${error}` });
    }
});

export default router;

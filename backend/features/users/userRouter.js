import { Router } from 'express';
const router = Router();

import UserRepository from './UserRepository.js';
import UserService from './UserService.js';
import db from '../../database/connection.js';

const userRepository = new UserRepository(db);
const userService = new UserService(userRepository);

router.post('/register', async (req, res) => {
    try {
        if (req.body.email === '' || req.body.password === '')
            return res.status(404).send({ error: 'Error: Username or password is missing.' });

        const user = await userService.register(req.body.email, req.body.password);

        return res.status(200).send({ message: 'User successfully registered.' + user });
    } catch (error) {
        res.status(500).send({ message: `Server error: ${error}` });
    }
});

export default router;

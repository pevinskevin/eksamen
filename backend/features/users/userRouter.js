import { Router } from 'express';
const router = Router();

import { userService } from '../../shared/factory/factory.js';

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

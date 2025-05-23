import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import { comparePassword, hashPassword } from '../util/hashing.js';
import isAuthenticated from '../middleware/authorisation.js';
import main from '../nodemailer/nodemailer.js';

router.get('/test', (req, res) => {
    console.log(req.session, req.session.id, req.session.role || 'No session role');
    res.send({ message: 'Hi!' });
});

// login
router.post('/login', async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM users where email = $1',
            values: [req.body.email],
        };

        const user = (await db.query(query)).rows.at(0);
        console.log(user);

        const matchingPasswords = await comparePassword(req.body.password, user.password_hash);
        if (!matchingPasswords) {
            return res
                .status(401)
                .send({ errorMessage: 'Provided password is incorrect. Please try again.' });
        }
        req.session.role = user.role;
        req.session.userId = user.user_id;
        
        return res.status(200).send({ message: 'User successfully validated' });
    } catch (error) {
        console.log(error);
        return res.status(404).send({
            errorMessage: "Provided user name is incorrect, or doesn't exist. Please try again.",
        });
    }
});

router.post('/logout', (req, res) => {
    if (!req.session.role) {
        return res.status(401).send({ message: 'User is not logged in.' });
    }
    req.session.destroy();
    return res.status(200).send({ message: 'User successfully logged out.' });
});

router.post('/register', async (req, res) => {
    try {
        if (req.body.email === '' || req.body.password === '')
            return res.status(400).send({ message: 'Error: Username or password is missing.' });

        const hashedPassword = await hashPassword(req.body.password);

        const query = {
            text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            values: [req.body.email, hashedPassword, 'user'],
        };
        await db.query(query);

        // const sendEmail = await main(req.body.email, req.body.username);

        return res.status(200).send({ message: 'User successfully registered.' });
    } catch (error) {
        res.status(404).send({ errorMessage: `${error}` });
    }
});

export default router;

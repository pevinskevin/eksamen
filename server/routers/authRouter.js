import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import { comparePassword, hashPassword } from '../util/hashing.js';
import authorize from '../middleware/authorisation.js';
import main from '../nodemailer/nodemailer.js';

router.get('/test', authorize, (req, res) => {
    console.log(req.session, req.session.id, req.session.role || 'No session role');
    res.send({ message: 'Hi!' });
});

// login
router.post('/login', async (req, res) => {
    try {
        const user = await db.get('SELECT * FROM users where username = (?)', [req.body.username]);
        const matchingPasswords = await comparePassword(req.body.password, user.password);
        if (!matchingPasswords) {
            return res
                .status(401)
                .send({ errorMessage: 'Provided password is incorrect. Please try again.' });
        }
        req.session.role = user.role;
        req.session.userId = user.id;
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
    if (req.body.username === '' || req.body.password === '')
        return res.status(400).send({ message: 'Error: Username or password is missing.' });

    const hashedPassword = await hashPassword(req.body.password);

    await db.all('INSERT INTO users (username, password, email,role) VALUES (?, ?, ?, ?)', [
        req.body.username,
        hashedPassword,
        req.body.email,
        'user',
    ]);

    const sendEmail = await main(req.body.email, req.body.username);

    return res.status(200).send({ message: 'User successfully registered.' });
});

export default router;

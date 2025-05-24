import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import { comparePassword, hashPassword } from '../util/hashing.js';
import main from '../nodemailer/nodemailer.js';

router.get('/test', (req, res) => {
    console.log(req.session, req.session.id, req.session.role || 'No session role');
    res.send({ data: 'Hi!' });
});

// login
router.post('/login', async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM users where email = $1',
            values: [req.body.email],
        };

        const user = (await db.query(query)).rows.at(0);

        const matchingPasswords = await comparePassword(req.body.password, user.password_hash);
        if (!matchingPasswords) {
            return res
                .status(401)
                .send({ error: 'Provided password is incorrect. Please try again.' });
        } else {
            req.session.role = user.role;
            req.session.userId = user.user_id;
            return res.status(200).send({
                data: {
                    user: { userId: user.user_id, email: user.email, role: user.role },
                },
                message: 'Login successful.',
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(404).send({
            error: "Provided user name is incorrect, or doesn't exist. Please try again.",
        });
    }
});

router.post('/logout', (req, res) => {
    console.log(
        'Logout Attempt - Session object:',
        JSON.stringify(req.session, 'UserId:', req.session.userId),
        'UserId:',
        req.session.userId
    );

    if (!req.session.role) {
        return res.status(401).send({ error: 'User is not logged in.' });
    } else {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).send({ error: 'Could not log out due to server error.' });
            }
        });
        return res.status(200).send({ message: 'User successfully logged out.' });
    }
});

router.post('/register', async (req, res) => {
    try {
        if (req.body.email === '' || req.body.password === '')
            return res.status(404).send({ error: 'Error: Username or password is missing.' });

        const hashedPassword = await hashPassword(req.body.password);

        const insertUserQuery = {
            text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            values: [req.body.email, hashedPassword, 'user'],
        };

        await db.query(insertUserQuery);

        const seedUserQuery = {
            text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
            values: ['SIM_USD', 10000.0, req.body.email],
        };

        await db.query(seedUserQuery);

        const sendEmail = await main(req.body.email, req.body.username);

        return res.status(200).send({ message: 'User successfully registered.' });
    } catch (error) {
        res.status(404).send({ error: `${error}` });
    }
});

export default router;

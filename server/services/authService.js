import { comparePassword, hashPassword } from '../util/hashing.js';
import main from '../nodemailer/nodemailer.js';

export async function login(body, db) {
    const { email, password } = body;

    const query = {
        text: 'SELECT * FROM users where email = $1',
        values: [email],
    };

    const user = (await db.query(query)).rows.at(0);

    if (!user) {
        throw new Error('User not found.');
    }

    const matchingPasswords = await comparePassword(password, user.password_hash);

    if (!matchingPasswords) {
        throw new Error('Provided password is incorrect.');
    }
    return user;
}

export async function logout(req, res) {
    if (!req.session.role) {
        return res.status(401).send({ error: 'User is not logged in.' });
    } else {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send({ error: 'Could not log out due to server error.' });
            }
        });
        return res.status(200).send({ message: 'User successfully logged out.' });
    }
}

export async function register(req, res, db) {
    try {
        if (req.body.email === '' || req.body.password === '')
            return res.status(404).send({ error: 'Error: Username or password is missing.' });

        const { password, email, username } = req.body;

        const hashedPassword = await hashPassword(password);

        const userInsertQuery = {
            text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            values: [email, hashedPassword, 'user'],
        };

        await db.query(userInsertQuery);

        const seedUserQuery = {
            text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
            values: ['SIM_USD', 10000.0, email],
        };

        await db.query(seedUserQuery);

        const sendEmail = await main(email, username);

        return res.status(200).send({ message: 'User successfully registered.' });
    } catch (error) {
        res.status(404).send({ error });
    }
}

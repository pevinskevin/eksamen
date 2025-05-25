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

export async function register(body, db) {
    const { password, email, username } = body;

    const hashedPassword = await hashPassword(password);

    const createUserQuery = {
        text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        values: [email, hashedPassword, 'user'],
    };

    await db.query(createUserQuery);

    const seedUserQuery = {
        text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
        values: ['SIM_USD', 10000.0, email],
    };

    await db.query(seedUserQuery);

    const sendEmail = await main(email, username);
}

import { USER_ROLES } from '../../shared/validators/validators.js';

export default class AuthRepository {
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        const query = {
            text: 'SELECT id, email, first_name, last_name, role, password_hash FROM users where email = $1',
            values: [email],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async create(firstName, lastName, email, hashedPassword) {
        const createUserQuery = {
            text: 'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, created_at, updated_at',
            values: [firstName, lastName, email, hashedPassword, USER_ROLES.USER],
        };
        return (await this.db.query(createUserQuery)).rows[0];
    }

    async seedUserFiatAccount(email) {
        const seedUserQuery = {
            text: 'INSERT INTO accounts (id, currency_code, balance) SELECT id, $1, $2 FROM users WHERE email = $3',
            values: ['SIM_USD', 10000.0, email],
        };
        await this.db.query(seedUserQuery);
    }
}

export default class UserRepository {
    constructor(db) {
        this.db = db;
    }

    async create(email, hashedPassword, firstName, lastName) {
        const createUserQuery = {
            text: 'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, first_name, last_name, role, created_at',
            values: [email, hashedPassword, firstName, lastName, 'user'],
        };
        const result = await this.db.query(createUserQuery);
        return result.rows[0];
    }

    async seedUserFiatAccount(email) {
        const seedUserQuery = {
            text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
            values: ['SIM_USD', 10000.0, email],
        };
        await this.db.query(seedUserQuery);
    }
}

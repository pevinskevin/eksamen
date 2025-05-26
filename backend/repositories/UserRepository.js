export default class UserRepository {
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        try {
            const query = {
                text: 'SELECT * FROM users where email = $1',
                values: [email],
            };
            return (await this.db.query(query)).rows.at(0);
        } catch (error) {
            throw new Error('userRepository error:' + error);
        }
    }
    async create(email, hashedPassword) {
        const createUserQuery = {
            text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            values: [email, hashedPassword, 'user'],
        };
        return await this.db.query(createUserQuery);
    }
    async seedUserFiatAccount(email) {
        const seedUserQuery = {
            text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
            values: ['SIM_USD', 10000.0, email],
        };
        await this.db.query(seedUserQuery);
    }
}

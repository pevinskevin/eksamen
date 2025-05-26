export default class UserRepository {
    constructor(db) {
        this.db = db;
    }

    async create(email, hashedPassword) {
        try {
            const createUserQuery = {
                text: 'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                values: [email, hashedPassword, 'user'],
            };
            return await this.db.query(createUserQuery);
        } catch (error) {
            throw new Error('userRepository error:' + error);
        }
    }
    
    async seedUserFiatAccount(email) {
        try {
            const seedUserQuery = {
                text: 'INSERT INTO accounts (user_id, currency_code, balance) SELECT user_id, $1, $2 FROM users WHERE email = $3',
                values: ['SIM_USD', 10000.0, email],
            };
            await this.db.query(seedUserQuery);
        } catch (error) {
            throw new Error('userRepository error:' + error);
        }
    }
}

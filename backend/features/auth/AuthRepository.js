export default class AuthRepository {
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        const query = {
            text: 'SELECT * FROM users where email = $1',
            values: [email],
        };
        return (await this.db.query(query)).rows.at(0);
    }
}

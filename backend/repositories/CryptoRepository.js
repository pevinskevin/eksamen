export default class CryptoRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        try {
            const query = {
                text: 'SELECT * FROM cryptocurrencies',
            };
            const responseData = (await db.query(query)).rows;
        } catch (error) {
            throw new Error('Repository error:' + error);
        }
    }
}

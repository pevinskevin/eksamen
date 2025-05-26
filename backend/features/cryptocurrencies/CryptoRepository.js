export default class CryptoRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        try {
            const query = {
                text: 'SELECT * FROM cryptocurrencies',
            };
            return (await this.db.query(query)).rows;
        } catch (error) {
            throw new Error('Repository error:' + error);
        }
    }

    async findById(id) {
        try {
            const query = {
                text: 'SELECT * FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [id],
            };
            return (await this.db.query(query)).rows;
        } catch (error) {
            throw new Error('Repository error:' + error);
        }
    }

    async create(cryptoData) {
        const { symbol, name, description, icon_url } = cryptoData;
        try {
            const query = {
                text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
                values: [symbol, name, description || null, icon_url || null],
            };
            const result = await this.db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error in CryptoRepository.create:', error.message, error.stack);
            throw new Error('Repository error creating cryptocurrency: ' + error.message);
        }
    }

    async update(id, cryptoData) {
        const { symbol, name, description, icon_url } = cryptoData;
        try {
            // First, check if the cryptocurrency exists
            const checkQuery = {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [id],
            };
            const existingCrypto = (await this.db.query(checkQuery)).rows;

            if (existingCrypto.length === 0) {
                return null; // Or throw an error, depending on desired handling
            }

            const query = {
                text: 'UPDATE cryptocurrencies SET symbol = COALESCE($2, symbol), name = COALESCE($3, name), description = COALESCE($4, description), icon_url = COALESCE($5, icon_url) WHERE cryptocurrency_id = $1 RETURNING *',
                values: [id, symbol, name, description, icon_url],
            };
            const result = await this.db.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error('Repository error updating cryptocurrency: ' + error.message);
        }
    }

    async deleteById(id) {
        try {
            // First, check if the cryptocurrency exists
            const checkQuery = {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
                values: [id],
            };
            const existingCrypto = (await this.db.query(checkQuery)).rows;

            if (existingCrypto.length === 0) {
                return null; // Or throw an error
            }

            const query = {
                text: 'DELETE FROM cryptocurrencies WHERE cryptocurrency_id = $1 RETURNING *',
                values: [id],
            };
            const result = await this.db.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error('Repository error deleting cryptocurrency: ' + error.message);
        }
    }
}

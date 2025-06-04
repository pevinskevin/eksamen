export default class CryptoRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        const query = {
            text: 'SELECT * FROM cryptocurrencies',
        };
        return (await this.db.query(query)).rows;
    }

    async findById(id) {
        const query = {
            text: 'SELECT * FROM cryptocurrencies WHERE id = $1',
            values: [id],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async findBySymbol(symbol) {
        const query = {
            text: 'SELECT * FROM cryptocurrencies WHERE symbol = $1',
            values: [symbol],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async create(symbol, name, description, iconUrl) {
        const query = {
            text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [symbol, name, description || null, iconUrl || null],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async update(id, symbol, name, description, iconUrl) {
        const query = {
            text: 'UPDATE cryptocurrencies SET symbol = COALESCE($2, symbol), name = COALESCE($3, name), description = COALESCE($4, description), icon_url = COALESCE($5, icon_url), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            values: [id, symbol, name, description, iconUrl],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async deleteById(id) {
        const query = {
            text: 'DELETE FROM cryptocurrencies WHERE id = $1 RETURNING *',
            values: [id],
        };
        return (await this.db.query(query)).rows.at(0);
    }
}

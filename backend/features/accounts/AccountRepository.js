export default class AccountRepository {
    constructor(db) {
        this.db = db;
    }
    async findFiatAccount(userId) {
        const accountQuery = {
            text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
            values: [userId],
        };
        return (await this.db.query(accountQuery)).rows.at(0);
    }

    async findAllCryptoHoldings(userId) {
        const cryptoHoldingsQuery = {
            text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
            values: [userId],
        };
        return (await this.db.query(cryptoHoldingsQuery)).rows;
    }

    async findCryptoHolding(userId, symbol) {
        const query = {
            text: 'SELECT * FROM crypto_holdings WHERE user_id = $1 AND symbol = $2',
            values: [userId, symbol],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async incrementCryptoHolding(userId, cryptocurrencyId, increment) {
        const query = {
            text: 'UPDATE crypto_holdings_base SET balance = balance + $1 WHERE user_id = $2 AND cryptocurrency_id = $3 RETURNING *',
            values: [increment, userId, cryptocurrencyId],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async incrementFiatAccount(userId, increment) {
        const query = {
            text: 'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            values: [increment, userId],
        };
        return (await this.db.query(query)).rows.at(0);
    }
}

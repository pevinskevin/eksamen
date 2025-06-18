export default class AccountRepository {
    constructor(db) {
        this.db = db;
    }
    async findFiatAccount(userId) {
        const accountQuery = {
            text: 'SELECT id, currency_code, balance, created_at, updated_at FROM accounts WHERE accounts.user_id = $1;',
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

    async updateAccount(userId, updatedInformationObject, passwordHash) {
        const { email = null, firstName = null, lastName = null } = updatedInformationObject;
        const query = {
            text: 'UPDATE users SET email = COALESCE($2, email), first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name), password_hash = COALESCE($5, password_hash), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING email, first_name, last_name',
            values: [userId, email, firstName, lastName, passwordHash],
        };
        return (await this.db.query(query)).rows.at(0);
    }


}

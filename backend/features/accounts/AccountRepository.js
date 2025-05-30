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
}

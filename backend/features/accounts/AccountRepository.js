export default class AccountRepository {
    constructor(db) {
        this.db = db;
    }
    async findFiatBalance(userId) {
        const accountQuery = {
            text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
            values: [userId],
        };
        return (await this.db.query(accountQuery)).rows.at(0);
    }

    async findAllCryptoBalances(userId) {
        const cryptoHoldingsQuery = {
            text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
            values: [userId],
        };
        return (await this.db.query(cryptoHoldingsQuery)).rows.at(0);
    }

    async findCryptoBalance(userId, symbol) {
        const query = {
            text: 'SELECT * FROM crypto_holdings WHERE user_id = $1 AND cryptocurrency_symbol = $2',
            values: [userId, symbol],
        };
        return await this.db.query(query).rows.at(0);
    }
}

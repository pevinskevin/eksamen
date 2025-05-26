export default class AccountRepository {
    constructor(db) {
        this.db = db;
    }
    async readFiatBalance(id) {
        try {
            const accountQuery = {
                text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
                values: [id],
            };
            return (await this.db.query(accountQuery)).rows;
        } catch (error) {
            throw new Error('Repository error' + error);
        }
    }

    async readCryptoBalance(id) {
        try {
            const cryptoHoldingsQuery = {
                text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
                values: [id],
            };
            return (await this.db.query(cryptoHoldingsQuery)).rows;
        } catch (error) {
            throw new Error('Repository error: ' + error);
        }
    }

    async readCryptoHoldingBySymbol(userId, symbol) {
        try {
            // First get the cryptocurrency ID
            const idQuery = {
                text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
                values: [symbol],
            };
            const idResult = await this.db.query(idQuery);

            if (idResult.rows.length === 0) {
                return null; // Cryptocurrency not found
            }

            const cryptocurrencyId = idResult.rows[0].cryptocurrency_id;

            // Then get the user's holdings for that cryptocurrency
            const holdingsQuery = {
                text: 'SELECT symbol, balance FROM crypto_holdings WHERE cryptocurrency_id = $1 AND user_id = $2',
                values: [cryptocurrencyId, userId],
            };
            const holdingsResult = await this.db.query(holdingsQuery);

            return holdingsResult.rows.length > 0 ? holdingsResult.rows[0] : [];
        } catch (error) {
            throw new Error('Repository error: ' + error);
        }
    }
}

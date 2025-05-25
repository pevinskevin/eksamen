import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import isAuthenticated from '../middleware/authorisation.js';

router.get('/balances', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.user;
        const accountQuery = {
            text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
            values: [id],
        };
        const accountResult = (await db.query(accountQuery)).rows;

        const cryptoHoldingsQuery = {
            text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
            values: [req.user.id],
        };
        const cryptoHoldingsResult = (await db.query(cryptoHoldingsQuery)).rows;

        res.send({
            message: 'Yay it worked - yummy data coming your way!! ٩(＾◡＾)۶ ',
            data: { account: accountResult, holdings: cryptoHoldingsResult },
        });
    } catch (error) {
        console.error('Error fetching balances:', error);
        res.status(500).send({ errorMessage: 'Server error while fetching balances.' });
    }
});

router.get('/crypto/:symbol', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.user.id;
        const symbol = req.params.symbol.toUpperCase();

        const idQuery = {
            text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
            values: [symbol],
        };
        const idResult = await db.query(idQuery);

        if (idResult.rows.length === 0) {
            return res
                .status(404)
                .send({ message: `Cryptocurrency with symbol '${symbol}' not found.` });
        }
        const cryptocurrencyId = idResult.rows[0].cryptocurrency_id;

        const symbolHoldingsQuery = {
            text: 'SELECT symbol, balance FROM crypto_holdings WHERE cryptocurrency_id = $1 AND user_id = $2',
            values: [cryptocurrencyId, user_id],
        };
        const holdingsResult = await db.query(symbolHoldingsQuery);

        if (holdingsResult.rows.length === 0) {
            return res
                .status(404)
                .send({ message: `No holdings found for symbol '${symbol}' for this user.` });
        }

        const specificHolding = holdingsResult.rows[0];

        res.send({
            message: 'Yay it worked - yummy data coming your way!! ٩(＾◡＾)۶ ',
            data: specificHolding,
        });
    } catch (error) {
        console.error(`Error fetching holding for symbol ${req.params.symbol}:`, error);
        res.status(500).send({
            errorMessage: 'Server error while fetching cryptocurrency holding.',
        });
    }
});

export default router;

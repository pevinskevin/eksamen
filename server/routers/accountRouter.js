import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import isAuthenticated from '../middleware/authorisation.js';

router.get('/account/balances', isAuthenticated, async (req, res) => {
    const query = {
        text: `SELECT * FROM accounts
               LEFT JOIN crypto_holdings on accounts.user_id = crypto_holdings.user_id
               WHERE accounts.user_id = $1;`,
        values: [req.user.id],
    };

    const data = await db.query(query)

    console.log(data.rows.at(0));
    console.log(req.user.id);
    

    res.send('Hi :)))))');
});


export default router;

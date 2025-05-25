import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';

router.post('/place', async (req, res) => {
    try {
        const order = req.body.data.order;
        const placeOrderQuery = {
            text: 'INSERT INTO orders (user_id, cryptocurrency_id, order_type, quantity_total, quantity_remaining, price, status) VALUES $1, $2, $3, $4, $5, $6, $7',
            values: [],
        };

        const response = (await db.query(placeOrderQuery)).rows;



    } catch (error) {
        console.log('Database connection error', error);
    }
});

export default router;

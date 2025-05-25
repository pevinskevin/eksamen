import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';

router.get('/', (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.get('/:id', (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.post('/', async (req, res) => {
    try {
        const {
            userId,
            cryptocurrencyId,
            orderType,
            quantityTotal,
            quantityRemaning,
            price,
            status,
        } = req.body.data.order;
        const placeOrderQuery = {
            text: 'INSERT INTO orders (user_id, cryptocurrency_id, order_type, quantity_total, quantity_remaining, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            values: [
                userId,
                cryptocurrencyId,
                orderType,
                quantityTotal,
                quantityRemaning,
                price,
                status,
            ],
        };

        const response = (await db.query(placeOrderQuery)).rows;
    } catch (error) {
        console.log('Database connection error', error);
    }
});

router.put('/:id', (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.delete('/:id', (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

export default router;

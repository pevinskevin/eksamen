import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';

import OrderService from './OrderService.js';
import OrderRepository from './OrderRepository.js';
import db from '../../database/connection.js';

const orderRepository = new OrderRepository(db);
const orderService = new OrderService(orderRepository);

router.get('/', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.get('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        // 1. Check user balance
        // 'SELECT balance FROM accounts WHERE user_id = ? AND currency_code = $1';
        // SELECT balance FROM crypto_holdings_base WHERE user_id = ? AND cryptocurrency_id = ?;

        const orderExample = {
            cryptocurrency_id: 1,
            type: 'buy', // 'buy' or 'sell'
            order_type: 'limit', // 'limit' or 'market'
            quantity: 10.5,
            price: 45000.0, // required for limit, optional for market
        };

        const { cryptocurrencyId, type, orderType, quantityTotal, price } = orderExample;

        const placeOrderQuery = {
            text: 'INSERT INTO orders (user_id, cryptocurrency_id, order_type, quantity_total, quantity_remaining, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            values: [userId, cryptocurrencyId, orderType, quantityTotal, price],
        };

        const response = (await db.query(placeOrderQuery)).rows;
    } catch (error) {
        console.log('Database connection error', error);
    }
});

router.put('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.delete('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

export default router;

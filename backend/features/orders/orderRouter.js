import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';

import CryptoRepository from '../cryptocurrencies/CryptoRepository.js';
import CryptoService from '../cryptocurrencies/CryptoService.js';
import OrderService from './OrderService.js';
import OrderRepository from './OrderRepository.js';
import db from '../../database/connection.js';

const cryptoRepository = new CryptoRepository(db);
const cryptoService = new CryptoService(cryptoRepository);

const orderRepository = new OrderRepository(db);
const orderService = new OrderService(orderRepository);

router.get('/', isAuthenticated, async (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.get('/:id', isAuthenticated, async (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { cryptocurrencyid, orderType, orderVariant, quantity, price } =
            await orderService.validate(req.body.data);

        const cryptocurrencyInDb = await cryptoService.getCryptocurrencyById(cryptocurrencyid);
        if (!cryptocurrencyInDb) {
            return res.status(404).send({ error: 'Cryptocurrency not found. Invalid ID.' });
        }

        const savedOrder = await orderService.save(
            cryptocurrencyid,
            orderType,
            orderVariant,
            quantity,
            price,
            req.user.id
        );
        return res.status(201).send({ message: 'Success YAY! ٩(＾◡＾)۶', data: savedOrder });
    } catch (error) {
        console.error('❌ ERROR IN orderRouter POST /:', error.message);
        console.error('📍 User ID:', req.user?.id);
        console.error('📍 Request body:', req.body);

        if (error.issues) {
            return res.status(400).send({ error: error.message });
        }
        res.status(500).send({ error: error.message });
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

export default router;

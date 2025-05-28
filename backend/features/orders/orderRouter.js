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
    try {
        const orderArray = await orderService.getAll(req.user.id);
        return res.send({ message: 'Hiii!! ٩(＾◡＾)۶', data: orderArray });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.getByOrderId(req.user.id, req.body.data.order_id);
        res.send({ message: 'Hiii!! ٩(＾◡＾)۶', data: order });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
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
        return res.status(500).send({ error: error.message });
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const {
            cryptocurrencyid,
            orderType,
            orderVariant,
            quantity,
            quantityRemaining,
            price,
            orderid,
        } = await orderService.validate(req.body.data);
        const updatedOrder = await orderService.updateByOrderId(req.user.id, req.body.data.order_id);
        res.send({ message: 'Hiii!! ٩(＾◡＾)۶', data: updatedOrder });
    } catch (error) {}
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedOrder = await orderService.deleteByOrderId(req.user.id, req.body.data.order_id);
        res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
    } catch (error) {}
});

export default router;

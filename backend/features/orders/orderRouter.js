import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';

import {orderService, cryptoService } from '../../shared/factory/factory.js';

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
    let ordre;
    try {
        ordre = await orderService.validate(req.body.data);
    } catch (error) {
        return res.status(422).send({ error: 'ValidationError', errorMessage: error.message });
    }

    try {
        const cryptocurrency = await cryptoService.getCryptocurrencyById(ordre.cryptocurrencyid);
        if (!cryptocurrency) {
            return res.status(404).send({
                error: 'NotFoundError',
                errorMessage: 'Cryptocurrency not found. Invalid ID: ' + ordre.cryptocurrencyid,
            });
        }
    } catch (error) {
        if (error.statusCode) {
            return res
                .status(error.statusCode)
                .send({ error: error.name || 'ServiceError', errorMessage: error.message });
        }
        return res.status(500).send({ error: 'ServiceError', errorMessage: error.message });
    }

    try {
        const order = await orderService.save(
            ordre.cryptocurrencyid,
            ordre.orderType,
            ordre.orderVariant,
            ordre.quantity,
            ordre.price,
            req.user.id
        );
        return res.status(201).send(order);
    } catch (error) {
        return res
            .status(500)
            .send({ error: 'UnespectedServerError', errorMessage: error.message });
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
        const updatedOrder = await orderService.updateByOrderId(
            req.user.id,
            req.body.data.order_id
        );
        res.send({ message: 'Hiii!! ٩(＾◡＾)۶', data: updatedOrder });
    } catch (error) {}
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedOrder = await orderService.deleteByOrderId(
            req.user.id,
            req.body.data.order_id
        );
        res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
    } catch (error) {}
});

export default router;

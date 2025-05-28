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

// Helper function to log errors with context
const logError = (error, context = {}) => {
    console.error('=== ORDER ERROR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Code:', error.code || 'UNKNOWN');
    console.error('Message:', error.message);
    console.error('Context:', { ...context, ...error.context });
    if (error.originalError) {
        console.error('Original Error:', error.originalError.message);
        console.error('Stack:', error.originalError.stack);
    } else {
        console.error('Stack:', error.stack);
    }
    console.error('==================');
};

router.get('/', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.get('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

router.post('/', isAuthenticated, async (req, res) => {
    const requestContext = {
        userId: req.user?.id,
        requestBody: req.body,
        endpoint: 'POST /orders',
    };

    try {
        const { cryptocurrencyid, orderType, orderVariant, quantity, price } =
            await orderService.validateOrder(req.body.data);

        const cryptocurrencyInDb = await cryptoService.getCryptocurrencyById(cryptocurrencyid);
        if (!cryptocurrencyInDb) {
            return res.status(404).send({
                error: 'Cryptocurrency not found. Invalid ID.',
                code: 'CRYPTOCURRENCY_NOT_FOUND',
                cryptocurrencyId: cryptocurrencyid,
            });
        }

        const savedOrder = await orderService.save(
            cryptocurrencyid,
            orderType,
            orderVariant,
            quantity,
            price,
            req.user.id
        );

        res.status(201).send({
            message: 'Success YAY! ٩(＾◡＾)۶',
            data: savedOrder,
        });
    } catch (error) {
        logError(error, requestContext);

        // Handle validation errors
        if (error.code === 'VALIDATION_ERROR') {
            return res.status(400).send({
                error: 'Invalid order data',
                code: error.code,
                details: error.context?.issues || [],
                message: error.message,
            });
        }

        // Handle database errors
        if (error.code === 'DATABASE_ERROR') {
            return res.status(500).send({
                error: 'Database operation failed',
                code: error.code,
                message: 'Unable to save order. Please try again.',
            });
        }

        // Handle service errors
        if (error.code === 'SERVICE_ERROR') {
            return res.status(500).send({
                error: 'Service operation failed',
                code: error.code,
                message: 'Unable to process order. Please try again.',
            });
        }

        // Handle cryptocurrency not found errors
        if (error.code === 'ORDER_INSERT_FAILED') {
            return res.status(500).send({
                error: 'Order creation failed',
                code: error.code,
                message: 'Unable to create order. Please try again.',
            });
        }

        // Handle unexpected errors
        return res.status(500).send({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred. Please try again.',
        });
    }
});

router.put('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＂)۶' });
});

router.delete('/:id', isAuthenticated, (req, res) => {
    res.send({ message: 'Hiii!! ٩(＾◡＾)۶' });
});

export default router;

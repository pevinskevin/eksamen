import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';
import { marketOrderEmitter } from '../../shared/events/marketOrderEmitter.js';
import { orderService } from '../../shared/factory/factory.js';
import {
    sendCreated,
    sendInternalServerError,
    sendNotFound,
    sendPaymentRequired,
    sendSuccess,
    sendUnprocessableEntity,
} from '../../shared/utils/responseHelpers.js';

// Get all open and partially filled orders for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const orders = await orderService.getAll(req.user.id);
        return sendSuccess(res, orders);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

// Get specific limit order by ID
router.get('/limit/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.getOpenOrderByUserAndOrderId(req.user.id, req.params.id);
        return sendSuccess(res, order);
    } catch (error) {
        // Order not found or not in open state (cancelled/filled)
        if (error.message.includes('Order with ID ')) {
            return sendNotFound(res, error.message);
        }
        // Validation error (invalid order ID format)
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

// Create a new limit order
router.post('/limit', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.validateAndSaveLimitOrder(req.body, req.user.id);
        return sendCreated(res, order);
    } catch (error) {
        // Insufficient balance errors (buy or sell)
        if (
            error.message.includes('Order value exceeds available balance') ||
            error.message.includes('Order quantity exceeds available balance')
        ) {
            return sendPaymentRequired(res, error.message);
        }
        // Cryptocurrency not found
        if (error.message.includes('Cryptocurrency with id')) {
            return sendNotFound(res, error.message);
        }
        // Request validation errors
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

// Create a new market order
router.post('/market', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.validateAndSaveMarketOrder(req.body, req.user.id);
        marketOrderEmitter.emit('marketOrderCreated', {
            order,
        });
        return sendCreated(res, order);
    } catch (error) {
        // Insufficient balance errors
        if (
            error.message.includes('Order notional value exceeds available balance') ||
            error.message.includes('Order value exceeds available balance')
        ) {
            return sendPaymentRequired(res, error.message);
        }
        // Cryptocurrency not found
        if (error.message.includes('Cryptocurrency with id')) {
            return sendNotFound(res, error.message);
        }
        // Request validation errors
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

// Update a limit order (only limit orders can be modified)
router.put('/limit/:id', isAuthenticated, async (req, res) => {
    try {
        // Convert string parameter to number for service layer
        const orderId = Number(req.params.id);
        const order = await orderService.validateAndUpdateByUserAndOrderId(
            req.user.id,
            orderId,
            req.body
        );
        return sendSuccess(res, order);
    } catch (error) {
        // Insufficient balance for updated order values
        if (
            error.message.includes('Updated order value exceeds available balance') ||
            error.message.includes('Updated order quantity exceeds available balance')
        ) {
            return sendPaymentRequired(res, error.message);
        }
        // Cryptocurrency not found (if cryptocurrencyId is being updated)
        if (error.message.includes('Cryptocurrency with id')) {
            return sendNotFound(res, error.message);
        }
        // Order not found or not in open state
        if (error.message.includes('Order with ID ')) {
            return sendNotFound(res, error.message);
        }
        // Request validation errors
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

// Delete a limit order (only limit orders can be deleted)
router.delete('/limit/:id', isAuthenticated, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await orderService.setStatusToCancelledByUserAndOrderId(req.user.id, orderId);
        return sendSuccess(res, order);
    } catch (error) {
        // Validation error (invalid order ID format)
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        // Order not found or not in cancelable state
        if (error.message.includes('Order with ID ')) {
            return sendNotFound(res, error.message);
        }
        return sendInternalServerError(res, error.message);
    }
});

export default router;

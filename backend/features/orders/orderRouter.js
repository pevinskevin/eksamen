import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';

import { orderService, cryptoService } from '../../shared/factory/factory.js';
import {
    sendCreated,
    sendInternalServerError,
    sendNotFound,
    sendPaymentRequired,
    sendSuccess,
    sendUnprocessableEntity, // ← Add this
} from '../../shared/utils/responseHelpers.js';

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const orders = await orderService.getAll(req.user.id);
        return sendSuccess(res, orders);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.getByOrderId(req.user.id, req.params.id);
        if (!order) sendNotFound(res, `Order with ID ${req.params.id}`);
        return sendSuccess(res, order);
    } catch (error) {
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const order = await orderService.save(req.body, req.user.id);
        return sendCreated(res, order);
    } catch (error) {
        if (
            error.message.includes('Order value exceeds available balance') ||
            error.message.includes('Order quantity exceeds available balance')
        )
            return sendPaymentRequired(res, error.message);
        if (error.message.includes('Cryptocurrency with id'))
            return sendNotFound(res, error.message);
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        return sendInternalServerError(res, error.message);
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const orders = orderService.getAll(req.user.id);
        return sendSuccess(res, orders);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const orders = orderService.getAll(req.user.id);
        return sendSuccess(res, orders);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

export default router;

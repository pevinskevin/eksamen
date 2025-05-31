import { Router } from 'express';
const router = Router();
import isAuthenticated from '../../shared/middleware/authorisation.js';

import { orderService, cryptoService } from '../../shared/factory/factory.js';
import {
    sendInternalServerError,
    sendNotFound,
    sendSuccess,
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
        if (!order) sendNotFound(res, `Order with ID ${req.params.id}`)
        return sendSuccess(res, order);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const orders = orderService.getAll(req.user.id);
        return sendSuccess(res, orders);
    } catch (error) {
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

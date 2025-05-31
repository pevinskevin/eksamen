import { Router } from 'express';
const router = Router();

import { cryptoService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';
import {
    sendConflict,
    sendCreated,
    sendError,
    sendInternalServerError,
    sendNotFound,
    sendSuccess,
    sendUnprocessableEntity,
} from '../../shared/utils/responseHelpers.js';

// Get all cryptocurrencies
router.get('/cryptocurrencies', async (req, res) => {
    try {
        const cryptocurrencies = await cryptoService.getAllCryptocurrencies();
        return sendSuccess(res, cryptocurrencies);
    } catch (error) {
        return sendError(res, error.message);
    }
});

// Get cryptocurrency by ID
router.get('/cryptocurrencies/:id', async (req, res) => {
    try {
        const cryptocurrency = await cryptoService.getCryptocurrencyById(req.params.id);
        return sendSuccess(res, cryptocurrency);
    } catch (error) {
        if (error.message.includes('Cryptocurrency with id')) {
            return sendNotFound(res, error.message);
        }
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        } else return sendInternalServerError(res, error.message);
    }
});

// Create new cryptocurrency
router.post('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
        const cryptocurrency = await cryptoService.createCryptocurrency(req.body);
        return sendCreated(res, cryptocurrency);
    } catch (error) {
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        if (error.message.includes('duplicate key')) sendConflict(res, error.message);
        else sendInternalServerError(res, error.message);
    }
});

// Update cryptocurrency by ID
router.put('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
    } catch (error) {}
});

// Delete cryptocurrency by ID
router.delete('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
    } catch (error) {}
});

export default router;

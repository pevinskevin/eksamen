import { Router } from 'express';
const router = Router();

import { cryptoService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';
import {
    sendConflict,
    sendCreated,
    sendError,
    sendForbidden,
    sendInternalServerError,
    sendNotFound,
    sendSuccess,
    sendUnprocessableEntity,
} from '../../shared/utils/responseHelpers.js';

// Get all cryptocurrencies - public endpoint
router.get('/cryptocurrencies', async (req, res) => {
    try {
        const cryptocurrencies = await cryptoService.getAllCryptocurrencies();
        return sendSuccess(res, cryptocurrencies);
    } catch (error) {
        return sendError(res, error.message);
    }
});

// Get cryptocurrency by ID - public endpoint
router.get('/cryptocurrencies/:id', async (req, res) => {
    try {
        const cryptocurrency = await cryptoService.getCryptocurrencyById(req.params.id);
        return sendSuccess(res, cryptocurrency);
    } catch (error) {
        if (error.message.includes('Cryptocurrency with id')) {
            return sendNotFound(res, error.message);
        }
        // Validation errors: invalid ID format
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
        // Validation errors: missing fields, invalid symbol format
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        // Database constraint: symbol already exists
        if (error.message.includes('duplicate key')) sendConflict(res, error.message);
        else sendInternalServerError(res, error.message);
    }
});

// Update cryptocurrency by ID
router.put('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const cryptocurrency = await cryptoService.updateCryptocurrency(req.params.id, req.body);
        return sendSuccess(res, cryptocurrency);
    } catch (error) {
        if (error.message.includes('Cryptocurrency ID')) sendNotFound(res, error.message);
        // Validation errors: invalid ID or update data format
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        // Database constraint: symbol already exists (if changing symbol)
        if (error.message.includes('duplicate key')) sendConflict(res, error.message);
        else sendInternalServerError(res, error.message);
    }
});

// Delete cryptocurrency by ID
router.delete('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const cryptocurrency = await cryptoService.deleteCryptocurrency(req.params.id);
        return sendSuccess(res, cryptocurrency);
    } catch (error) {
        // Foreign key constraint: cryptocurrency is referenced by orders/holdings
        if (error.message.includes('update or delete on table')) {
            return sendForbidden(res, error.message);
        }
        if (error.message.includes('Cryptocurrency ID')) {
            return sendNotFound(res, error.message);
        }
        // Validation errors: invalid ID format
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        } else return sendInternalServerError(res, error.message);
    }
});

export default router;

import { Router } from 'express';
const router = Router();

import { cryptoService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';
import { sendError, sendSuccess } from '../../shared/utils/responseHelpers.js';

// Get all cryptocurrencies
router.get('/cryptocurrencies', async (req, res) => {
    try {
        const cryptocurrencies = await cryptoService.getAllCryptocurrencies();
        return sendSuccess(res, cryptocurrencies);
    } catch (error) {
        return sendError(res, error.message)
    }
});

// Get cryptocurrency by ID
router.get('/cryptocurrencies/:id', async (req, res) => {
    try {
    } catch (error) {}
});

// Create new cryptocurrency
router.post('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
    } catch (error) {}
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

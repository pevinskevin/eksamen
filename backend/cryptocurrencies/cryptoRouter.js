import { Router } from 'express';
const router = Router();

import CryptoRepository from './CryptoRepository.js';
import CryptoService from './CryptoService.js';
import db from '../database/connection.js'; //
import isAuthenticated from '../middleware/authorisation.js';

const cryptoRepository = new CryptoRepository(db);
const cryptoService = new CryptoService(cryptoRepository);

// Get all cryptocurrencies
router.get('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
        const cryptocurrencies = await cryptoService.getAllCryptocurrencies();
        res.status(200).json({
            success: true,
            data: cryptocurrencies,
        });
    } catch (error) {
        console.error('Error in GET /cryptocurrencies:', error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to retrieve cryptocurrencies',
        });
    }
});

// Get cryptocurrency by ID
router.get('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const cryptocurrency = await cryptoService.getCryptocurrencyById(id);
        res.status(200).json({
            success: true,
            data: cryptocurrency,
        });
    } catch (error) {
        console.error(`Error in GET /cryptocurrencies/${req.params.id}:`, error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to retrieve cryptocurrency',
        });
    }
});

// Create new cryptocurrency
router.post('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
        const createdCrypto = await cryptoService.createCryptocurrency(req.body);
        res.status(201).json({
            success: true,
            data: createdCrypto,
            message: 'Cryptocurrency created successfully',
        });
    } catch (error) {
        console.error('Error in POST /cryptocurrencies:', error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to create cryptocurrency',
        });
    }
});

// Update cryptocurrency by ID
router.put('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCrypto = await cryptoService.updateCryptocurrency(id, req.body);
        res.status(200).json({
            success: true,
            data: updatedCrypto,
            message: 'Cryptocurrency updated successfully',
        });
    } catch (error) {
        console.error(`Error in PUT /cryptocurrencies/${req.params.id}:`, error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to update cryptocurrency',
        });
    }
});

// Delete cryptocurrency by ID
router.delete('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCrypto = await cryptoService.deleteCryptocurrency(id);
        res.status(200).json({
            success: true,
            data: deletedCrypto,
            message: 'Cryptocurrency deleted successfully',
        });
    } catch (error) {
        console.error(`Error in DELETE /cryptocurrencies/${req.params.id}:`, error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to delete cryptocurrency',
        });
    }
});

export default router;

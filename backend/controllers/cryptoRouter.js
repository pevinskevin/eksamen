import { Router } from 'express';
import db from '../database/connection.js';
const router = Router();
import isAuthenticated from '../middleware/authorisation.js';


// Get all cryptocurrencies
router.get('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
        const query = {
            text: 'SELECT * FROM cryptocurrencies',
        };
        const responseData = (await db.query(query)).rows;
        console.log('Query executed:', query.text);
        res.status(200).json({
            success: true,
            data: responseData,
            count: responseData.length,
        });
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cryptocurrencies',
            message: error.message,
        });
    }
});

// Get cryptocurrency by ID
router.get('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const query = {
            text: 'SELECT * FROM cryptocurrencies WHERE cryptocurrency_id = $1',
            values: [id],
        };
        const responseData = (await db.query(query)).rows;

        if (responseData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cryptocurrency not found',
            });
        }

        console.log('Query executed:', query.text, 'with values:', query.values);
        res.status(200).json({
            success: true,
            data: responseData[0],
        });
    } catch (error) {
        console.error('Error fetching cryptocurrency by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cryptocurrency',
            message: error.message,
        });
    }
});

// Create new cryptocurrency
router.post('/cryptocurrencies', isAuthenticated, async (req, res) => {
    try {
        const { symbol, name, description, icon_url } = req.body;

        // Basic validation
        if (!symbol || !name) {
            return res.status(400).json({
                success: false,
                error: 'Symbol and name are required fields',
            });
        }

        const query = {
            text: 'INSERT INTO cryptocurrencies (symbol, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [symbol, name, description || null, icon_url || null],
        };

        const responseData = (await db.query(query)).rows[0];
        console.log('Query executed:', query.text, 'with values:', query.values);

        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Cryptocurrency created successfully',
        });
    } catch (error) {
        console.error('Error creating cryptocurrency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create cryptocurrency',
            message: error.message,
        });
    }
});

// Update cryptocurrency by ID
router.put('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { symbol, name, description, icon_url } = req.body;

        // Check if cryptocurrency exists
        const checkQuery = {
            text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
            values: [id],
        };
        const existingCrypto = (await db.query(checkQuery)).rows;

        if (existingCrypto.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cryptocurrency not found',
            });
        }

        const query = {
            text: 'UPDATE cryptocurrencies SET symbol = COALESCE($2, symbol), name = COALESCE($3, name), description = COALESCE($4, description), icon_url = COALESCE($5, icon_url) WHERE cryptocurrency_id = $1 RETURNING *',
            values: [id, symbol, name, description, icon_url],
        };

        const responseData = (await db.query(query)).rows[0];
        console.log('Query executed:', query.text, 'with values:', query.values);

        res.status(200).json({
            success: true,
            data: responseData,
            message: 'Cryptocurrency updated successfully',
        });
    } catch (error) {
        console.error('Error updating cryptocurrency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cryptocurrency',
            message: error.message,
        });
    }
});

// Delete cryptocurrency by ID
router.delete('/cryptocurrencies/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if cryptocurrency exists
        const checkQuery = {
            text: 'SELECT cryptocurrency_id FROM cryptocurrencies WHERE cryptocurrency_id = $1',
            values: [id],
        };
        const existingCrypto = (await db.query(checkQuery)).rows;

        if (existingCrypto.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cryptocurrency not found',
            });
        }

        const query = {
            text: 'DELETE FROM cryptocurrencies WHERE cryptocurrency_id = $1 RETURNING *',
            values: [id],
        };

        const responseData = (await db.query(query)).rows[0];
        console.log('Query executed:', query.text, 'with values:', query.values);

        res.status(200).json({
            success: true,
            data: responseData,
            message: 'Cryptocurrency deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting cryptocurrency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete cryptocurrency',
            message: error.message,
        });
    }
});

export default router;

import sharedAxiosInstance from './sharedAxios.js';
import dotenv from 'dotenv';

dotenv.config();

// Base URL for API requests
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

// Cryptocurrency functions

/**
 * Get all cryptocurrencies
 * @returns {Promise<Object>} Response data containing all cryptocurrencies
 */
export const getAllCryptocurrencies = async () => {
    try {
        const response = await sharedAxiosInstance.get(`${BASE_URL}/cryptocurrencies`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Get a specific cryptocurrency by ID
 * @param {string|number} id - The cryptocurrency ID
 * @returns {Promise<Object>} Response data containing the cryptocurrency
 */
export const getCryptocurrencyById = async (id) => {
    try {
        if (!id) {
            throw new Error('Cryptocurrency ID is required');
        }
        const response = await sharedAxiosInstance.get(`${BASE_URL}/cryptocurrencies/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Create a new cryptocurrency
 * @param {Object} cryptoData - The cryptocurrency data
 * @param {string} cryptoData.symbol - The cryptocurrency symbol (required)
 * @param {string} cryptoData.name - The cryptocurrency name (required)
 * @param {string} [cryptoData.description] - The cryptocurrency description
 * @param {string} [cryptoData.icon_url] - The URL to the cryptocurrency icon
 * @returns {Promise<Object>} Response data containing the created cryptocurrency
 */
export const createCryptocurrency = async (cryptoData) => {
    try {
        if (!cryptoData || !cryptoData.symbol || !cryptoData.name) {
            throw new Error('Symbol and name are required fields');
        }

        const response = await sharedAxiosInstance.post(`${BASE_URL}/cryptocurrencies`, cryptoData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Update an existing cryptocurrency
 * @param {string|number} id - The cryptocurrency ID
 * @param {Object} updateData - The data to update
 * @param {string} [updateData.symbol] - The cryptocurrency symbol
 * @param {string} [updateData.name] - The cryptocurrency name
 * @param {string} [updateData.description] - The cryptocurrency description
 * @param {string} [updateData.icon_url] - The URL to the cryptocurrency icon
 * @returns {Promise<Object>} Response data containing the updated cryptocurrency
 */
export const updateCryptocurrency = async (id, updateData) => {
    try {
        if (!id) {
            throw new Error('Cryptocurrency ID is required');
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            throw new Error('Update data is required');
        }

        const response = await sharedAxiosInstance.put(
            `${BASE_URL}/cryptocurrencies/${id}`,
            updateData
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Delete a cryptocurrency
 * @param {string|number} id - The cryptocurrency ID
 * @returns {Promise<Object>} Response data confirming deletion
 */
export const deleteCryptocurrency = async (id) => {
    try {
        if (!id) {
            throw new Error('Cryptocurrency ID is required');
        }

        const response = await sharedAxiosInstance.delete(`${BASE_URL}/cryptocurrencies/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Search cryptocurrencies by symbol
 * @param {string} symbol - The symbol to search for
 * @returns {Promise<Object>} Response data containing matching cryptocurrencies
 */
export const searchCryptocurrencyBySymbol = async (symbol) => {
    try {
        if (!symbol) {
            throw new Error('Symbol is required for search');
        }

        // Get all cryptocurrencies and filter by symbol
        const allCryptos = await getAllCryptocurrencies();
        const filteredCryptos = allCryptos.data.filter((crypto) =>
            crypto.symbol.toLowerCase().includes(symbol.toLowerCase())
        );

        return {
            success: true,
            data: filteredCryptos,
            count: filteredCryptos.length,
        };
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Search cryptocurrencies by name
 * @param {string} name - The name to search for
 * @returns {Promise<Object>} Response data containing matching cryptocurrencies
 */
export const searchCryptocurrencyByName = async (name) => {
    try {
        if (!name) {
            throw new Error('Name is required for search');
        }

        // Get all cryptocurrencies and filter by name
        const allCryptos = await getAllCryptocurrencies();
        const filteredCryptos = allCryptos.data.filter((crypto) =>
            crypto.name.toLowerCase().includes(name.toLowerCase())
        );

        return {
            success: true,
            data: filteredCryptos,
            count: filteredCryptos.length,
        };
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Get cryptocurrency statistics (summary of all cryptocurrencies)
 * @returns {Promise<Object>} Response data containing statistics
 */
export const getCryptocurrencyStats = async () => {
    try {
        const allCryptos = await getAllCryptocurrencies();

        if (!allCryptos.success || !allCryptos.data.length) {
            return {
                success: true,
                data: {
                    total_count: 0,
                    symbols: [],
                    has_descriptions: 0,
                    has_icons: 0,
                },
            };
        }

        const stats = allCryptos.data.reduce(
            (acc, crypto) => {
                acc.symbols.push(crypto.symbol);
                if (crypto.description) acc.has_descriptions++;
                if (crypto.icon_url) acc.has_icons++;
                return acc;
            },
            {
                symbols: [],
                has_descriptions: 0,
                has_icons: 0,
            }
        );

        return {
            success: true,
            data: {
                total_count: allCryptos.data.length,
                symbols: stats.symbols,
                has_descriptions: stats.has_descriptions,
                has_icons: stats.has_icons,
                completion_rate: {
                    descriptions:
                        ((stats.has_descriptions / allCryptos.data.length) * 100).toFixed(1) + '%',
                    icons: ((stats.has_icons / allCryptos.data.length) * 100).toFixed(1) + '%',
                },
            },
        };
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

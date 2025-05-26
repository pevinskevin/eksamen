import sharedAxiosInstance from './sharedAxios.js';
import dotenv from 'dotenv';

dotenv.config();

// Base URL for API requests
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

// Account functions
export const getAccountBalances = async () => {
    try {
        const response = await sharedAxiosInstance.get(`${BASE_URL}/account/balances`);
        // withCredentials is set on the instance itself
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getBTCBalance = async () => {
    try {
        const response = await sharedAxiosInstance.get(`${BASE_URL}/account/crypto/BTC`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

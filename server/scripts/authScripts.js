import sharedAxiosInstance from './sharedAxios.js';
import dotenv from 'dotenv';

dotenv.config();

// Base URL for API requests
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

// Authentication functions
export const login = async (
    email = process.env.DEFAULT_EMAIL,
    password = process.env.DEFAULT_PASSWORD
) => {
    try {
        const response = await sharedAxiosInstance.post(`${BASE_URL}/login`, { email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const register = async (
    email = process.env.DEFAULT_EMAIL,
    password = process.env.DEFAULT_PASSWORD
) => {
    try {
        const response = await sharedAxiosInstance.post(`${BASE_URL}/register`, {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const logout = async () => {
    try {
        const response = await sharedAxiosInstance.post(`${BASE_URL}/logout`, {});
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

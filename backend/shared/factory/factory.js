import db from '../../database/connection.js';

// Account
import AccountRepository from '../../features/accounts/AccountRepository.js';
import AccountService from '../../features/accounts/AccountService.js';
export const accountRepository = new AccountRepository(db);
export const accountService = new AccountService(accountRepository);

// Auth
import AuthRepository from '../../features/auth/AuthRepository.js';
import AuthService from '../../features/auth/AuthService.js';
export const authRepository = new AuthRepository(db);
export const authService = new AuthService(authRepository);

// Cryptocurrency
import CryptoRepository from '../../features/cryptocurrencies/CryptoRepository.js';
import CryptoService from '../../features/cryptocurrencies/CryptoService.js';
export const cryptoRepository = new CryptoRepository(db);
export const cryptoService = new CryptoService(cryptoRepository);

// Order
import OrderRepository from '../../features/orders/OrderRepository.js';
import OrderService from '../../features/orders/OrderService.js';
export const orderRepository = new OrderRepository(db);
export const orderService = new OrderService(orderRepository);

// User
import UserRepository from '../../features/users/UserRepository.js';
import UserService from '../../features/users/UserService.js';
export const userRepository = new UserRepository(db);
export const userService = new UserService(userRepository);

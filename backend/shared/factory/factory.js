import AccountRepository from './AccountRepository.js';
import AccountService from './AccountService.js';
import AuthRepository from './AuthRepository.js';
import AuthService from './AuthService.js';
import CryptoRepository from './CryptoRepository.js';
import CryptoService from './CryptoService.js';
import OrderRepository from './OrderRepository.js';
import OrderService from './OrderService.js';

import db from '../../database/connection.js';

export const accountRepository = new AccountRepository(db);
export const accountService = new AccountService(accountRepository);

export const authRepository = new AuthRepository(db);
export const authService = new AuthService(authRepository);

export const cryptoRepository = new CryptoRepository(db);
export const cryptoService = new CryptoService(cryptoRepository);

export const orderRepository = new OrderRepository(db);
export const orderService = new OrderService(orderRepository);

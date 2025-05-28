import OrderRepository from './OrderRepository.js';
import OrderService from './OrderService.js';
import CryptoRepository from '../cryptocurrencies/CryptoRepository.js';
import CryptoService from '../cryptocurrencies/CryptoService.js';

export function createOrderDependencies(db) {
    const cryptoRepository = new CryptoRepository(db);
    const cryptoService = new CryptoService(cryptoRepository);

    const orderRepository = new OrderRepository(db);
    // Pass cryptoService to OrderService constructor
    const orderService = new OrderService(orderRepository, cryptoService);

    return {
        cryptoService, // cryptoService might still be used directly in the router
        orderService,
    };
}

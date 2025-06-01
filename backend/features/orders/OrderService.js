import { validateCreateOrder, validateOrderId } from '../../shared/validators/orderValidators.js';
import cryptoService from '../cryptocurrencies/CryptoService.js';
export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async deleteByOrderId(userId, orderId) {
        return await this.orderRepository.delete(userId, orderId);
    }

    async getAll(userId) {
        return await this.orderRepository.findAll(userId);
    }

    async getByOrderId(userId, orderId) {
        validateOrderId(orderId);
        return await this.orderRepository.find(userId, orderId);
    }

    async save(order, userId) {
        // 1. Check if buy or sell.
        // 2. Validate order format.
        // 3. get balance/holdings
        // 4. Aggregate quantityRemaining of all open orders
        // 5. Subtract aggregate qR from balance/holdings.
        // 6. If order.quantityTotal > a.qR --> send status 402. Else sendCreated.

        // validate order format
        validateCreateOrder(order);

        // validate cryptocurrency exists
        const cryptocurrency = await cryptoService.findById(order.cryptoId);
        if (!cryptocurrency) throw new Error('Cryptocurrency with id ' + order.cryptoId);

        // check if limit buy or limit sell
        if (order.orderType === 'limit' && order.orderVariant === 'buy') {
            // 1. Get available balance
            const balance = cryptoService.getFiatAccountByUserID(userId);
            const quantityRemainingOfAllOpenOrders = this.orderRepository.findAllOpenBuyOrders(userId);



            let totalPrice;


        }
        else if (order.orderType === 'limit' && order.orderVariant === 'sell') {
        }

        async function saveOrder(order, userId) {
            const { cryptocurrencyId, orderType, orderVariant, quantityTotal, price } = order;
            const savedOrder = await this.orderRepository.save(
                cryptocurrencyId,
                orderType,
                orderVariant,
                quantityTotal,
                price,
                userId
            );
            savedOrder.price = savedOrder.price?.toString() || '0.00'; // setting to 0 if market order.
            return savedOrder;
        }
    }

    async updateByOrderId(
        cryptocurrencyId,
        orderType,
        orderVariant,
        quantity,
        quantityRemaining,
        price,
        userId,
        orderId
    ) {
        return await this.orderRepository.update(
            cryptocurrencyId,
            orderType,
            orderVariant,
            quantity,
            quantityRemaining,
            price,
            userId,
            orderId
        );
    }
}

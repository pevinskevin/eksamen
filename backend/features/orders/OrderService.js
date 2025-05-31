import { validateCreateOrder, validateOrderId } from '../../shared/validators/orderValidators.js';
import { toSnakeCase } from '../../shared/utils/caseConverter.js';
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
        validateCreateOrder(order);
        const orderInSnakeCase = toSnakeCase(order);
        console.log(orderInSnakeCase);
        
        const { cryptocurrencyId, orderType, orderVariant, quantity, price } = orderInSnakeCase;
        return await this.orderRepository.save(
            cryptocurrencyId,
            orderType,
            orderVariant,
            quantity,
            price,
            userId
        );
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

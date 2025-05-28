import { parse, parseAsync } from 'valibot';
import { orderSchema } from './ordersValidation.js';

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
        return await this.orderRepository.find(userId, orderId);
    }

    async validate(orderObject) {
        return await parseAsync(orderSchema, orderObject);
    }

    async save(cryptocurrencyid, orderType, orderVariant, quantity, price, userId) {
        return await this.orderRepository.save(
            cryptocurrencyid,
            orderType,
            orderVariant,
            quantity,
            price,
            userId
        );
    }

    async updateByOrderId(
        cryptocurrencyid,
        orderType,
        orderVariant,
        quantity,
        quantityRemaining,
        price,
        userId,
        orderId
    ) {
        return await this.orderRepository.update(
            cryptocurrencyid,
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

import { parse, parseAsync } from 'valibot';
import { orderSchema } from './ordersValidation.js';

export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async validateOrder(orderObject) {
        try {
            return await parseAsync(orderSchema, orderObject);
        } catch (error) {
            console.error('❌ ERROR IN OrderService.validateOrder:', error.message);
            console.error('📍 Input:', orderObject);
            throw new Error(`OrderService.validateOrder failed: ${error.message}`);
        }
    }

    async saveOrder(cryptocurrencyid, orderType, orderVariant, quantity, price, userid) {
        try {
            return await this.orderRepository.save(
                cryptocurrencyid,
                orderType,
                orderVariant,
                quantity,
                price,
                userid
            );
        } catch (error) {
            console.error('❌ ERROR IN OrderService.save:', error.message);
            console.error('📍 Parameters:', {
                cryptocurrencyid,
                orderType,
                orderVariant,
                quantity,
                price,
                userid,
            });
            throw new Error(`OrderService.save failed: ${error.message}`);
        }
    }
}

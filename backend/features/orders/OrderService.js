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
            const validationError = new Error(`Order validation failed: ${error.message}`);
            validationError.code = 'VALIDATION_ERROR';
            validationError.originalError = error;
            validationError.context = {
                operation: 'OrderService.validateOrder',
                input: orderObject,
                issues: error.issues || [],
            };
            throw validationError;
        }
    }

    async save(cryptocurrencyid, orderType, orderVariant, quantity, price, userid) {
        try {
            const result = await this.orderRepository.save(
                cryptocurrencyid,
                orderType,
                orderVariant,
                quantity,
                price,
                userid
            );

            if (!result) {
                const error = new Error('Order save operation returned null/undefined');
                error.code = 'SERVICE_ERROR';
                error.context = {
                    operation: 'OrderService.save',
                    parameters: {
                        cryptocurrencyid,
                        orderType,
                        orderVariant,
                        quantity,
                        price,
                        userid,
                    },
                };
                throw error;
            }

            return result;
        } catch (error) {
            // If it's already a structured error from repository, re-throw it
            if (error.code && error.context) {
                throw error;
            }

            // Wrap unexpected errors
            const serviceError = new Error(`Service error in OrderService.save: ${error.message}`);
            serviceError.code = 'SERVICE_ERROR';
            serviceError.originalError = error;
            serviceError.context = {
                operation: 'OrderService.save',
                parameters: { cryptocurrencyid, orderType, orderVariant, quantity, price, userid },
            };
            throw serviceError;
        }
    }
}

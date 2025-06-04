import {
    validateCreateOrder,
    validateOrderId,
    validateUpdateOrder,
} from '../../shared/validators/orderValidators.js';
import { cryptoService, accountService } from '../../shared/factory/factory.js';
import { ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async deleteByUserAndOrderId(userId, orderId) {
        // Validate that the orderId is in correct format
        validateOrderId(orderId);

        // Verify order exists and is in a state that allows deletion (open orders only)
        await this.getOpenOrderByUserAndOrderId(userId, orderId);

        // Proceed with deletion if validation passes
        const deletedOrder = await this.orderRepository.delete(userId, orderId);

        return normaliseForOpenAPI(deletedOrder);
    }

    async getAll(userId) {
        const orderArray = await this.orderRepository.findAllAscending(userId);
        return normaliseForOpenAPI(orderArray);
    }

    async getOpenOrderByUserAndOrderId(userId, orderId) {
        // Validate order ID format
        validateOrderId(orderId);

        // Fetch the order from database
        const order = await this.orderRepository.find(userId, orderId);

        // Check if order exists and is in a state that allows modification
        if (
            !order ||
            order.status === ORDER_STATUS.CANCELLED ||
            order.status === ORDER_STATUS.FULLY_FILLED
        ) {
            throw new Error('Order with ID ' + orderId);
        } else {
            return normaliseForOpenAPI(order);
        }
    }

    async save(order, userId) {
        // --- NOTE: THIS NEEDS MAJOR REFACTORING - WILL BE PUT OFF FOR LATER DUE TO TIME CONSTRAINT ----

        // Validate order format and verify cryptocurrency exists
        validateCreateOrder(order);
        await cryptoService.getCryptocurrencyById(order.cryptocurrencyId);

        if (order.orderVariant === ORDER_VARIANT.BUY) {
            // Get user's current fiat account balance (returned as string from service)
            const stringBalance = (await accountService.getFiatAccountByUserID(userId)).balance;
            const balance = Number(stringBalance);

            // We need to calculate how much USD is already committed to open buy orders
            // to determine available balance for this new order
            let sumOrderValues = 0;
            const arrayOpenOrders = await this.orderRepository.findAllOpenBuyOrders(userId);

            arrayOpenOrders.forEach((element) => {
                // Convert DB strings to numbers for calculation
                const quantityRemaining = Number(element.quantity_remaining);
                const price = Number(element.price);
                const orderValue = quantityRemaining * price; // USD value of this open order
                sumOrderValues += orderValue;
            });

            const availableBalance = balance - sumOrderValues; // Available USD after existing orders

            // Calculate USD value of the new order being placed
            const orderQuantityTotal = Number(order.quantityTotal);
            const orderPrice = Number(order.price);
            const orderValue = orderQuantityTotal * orderPrice;

            // Check if user has sufficient available balance
            if (orderValue > availableBalance) {
                throw new Error('Order value exceeds available balance');
            } else {
                return this.saveOrder(order, userId);
            }
        } else if (order.orderVariant === ORDER_VARIANT.SELL) {
            // Get the cryptocurrency symbol and user's holding balance
            const symbol = (await cryptoService.getCryptocurrencyById(order.cryptocurrencyId))
                .symbol;
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, symbol)
            ).balance;
            const balance = Number(stringBalance);

            // Calculate crypto quantity tied up in existing open sell orders

            // PostgreSQL SUM function returns result as string in sum property
            const stringSumQuantityRemainingOpenOrders = (
                await this.orderRepository.findAllOpenSellOrders(userId)
            ).sum;
            const sumQuantityRemainingOpenOrders = Number(stringSumQuantityRemainingOpenOrders);

            // Balance validation for new sell order

            const availableBalance = balance - sumQuantityRemainingOpenOrders; // Available crypto after existing orders
            const orderQuantity = Number(order.quantityTotal);

            // Check if user has sufficient available crypto balance
            if (orderQuantity > availableBalance) {
                throw new Error('Order quantity exceeds available balance');
            } else {
                return this.saveOrder(order, userId);
            }
        }
    }

    async update(userId, orderId, order) {
        const { cryptocurrencyId, quantityTotal, price, status } = order;

        // If quantity_total is being updated, reset quantity_remaining to match
        // This assumes order modifications reset any partial fills
        let quantityRemaining = undefined;
        if (quantityTotal !== undefined) quantityRemaining = quantityTotal;

        const updatedOrder = await this.orderRepository.update(
            userId,
            orderId,
            cryptocurrencyId,
            quantityTotal,
            quantityRemaining,
            price,
            status
        );

        return normaliseForOpenAPI(updatedOrder);
    }

    async updateByUserAndOrderId(userId, orderId, order) {
        // ==========================================
        // STEP 1: VALIDATION & SETUP
        // ==========================================

        // Validate update order format
        validateUpdateOrder(order);

        // Get the original order to determine its variant and cryptocurrency
        const originalOrder = await this.getOpenOrderByUserAndOrderId(userId, orderId);
        const originalOrderVariant = originalOrder.orderVariant; // Not included in request body

        // Get cryptocurrency symbol for sell order balance checks
        const originalOrderSymbol = (
            await cryptoService.getCryptocurrencyById(originalOrder.cryptocurrencyId)
        ).symbol; // Not included in request body

        // ==========================================
        // STEP 2: ROUTE BY ORIGINAL ORDER VARIANT
        // ==========================================

        if (originalOrderVariant === ORDER_VARIANT.BUY) {
            // ========================================
            // UPDATE BUY ORDER PROCESSING
            // ========================================

            // Get user's current fiat account balance (returned as string from service)
            const stringBalance = (await accountService.getFiatAccountByUserID(userId)).balance;
            const balance = Number(stringBalance);

            // ----------------------------------------
            // Calculate USD value tied up in existing open buy orders
            // ----------------------------------------

            // We need to calculate how much USD is already committed to open buy orders
            // to determine available balance for this updated order
            let sumOrderValues = 0;
            const arrayOpenOrders = await this.orderRepository.findAllOpenBuyOrders(userId);

            arrayOpenOrders.forEach((element) => {
                // Convert DB strings to numbers for calculation
                const quantityRemaining = Number(element.quantity_remaining);
                const price = Number(element.price);
                const orderValue = quantityRemaining * price; // USD value of this open order
                sumOrderValues += orderValue;
            });

            // ----------------------------------------
            // Balance validation for updated buy order
            // ----------------------------------------

            const availableBalance = balance - sumOrderValues; // Available USD after existing orders

            // Calculate USD value of the updated order
            const orderQuantityTotal = Number(order.quantityTotal);
            const orderPrice = Number(order.price);
            const orderValue = orderQuantityTotal * orderPrice;

            // Check if user has sufficient available balance for the update
            if (orderValue > availableBalance) {
                throw new Error('Updated order value exceeds available balance');
            } else {
                return await this.update(userId, orderId, order);
            }
        } else if (originalOrderVariant === ORDER_VARIANT.SELL) {
            // ========================================
            // UPDATE SELL ORDER PROCESSING
            // ========================================

            // Get user's crypto holding balance for the original order's symbol
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, originalOrderSymbol)
            ).balance;
            const balance = Number(stringBalance);

            // ----------------------------------------
            // Calculate crypto quantity tied up in existing open sell orders
            // ----------------------------------------

            // PostgreSQL SUM function returns result as string in sum property
            const stringSumQuantityRemainingOpenOrders = (
                await this.orderRepository.findAllOpenSellOrders(userId)
            ).sum;
            const sumQuantityRemainingOpenOrders = Number(stringSumQuantityRemainingOpenOrders);

            // ----------------------------------------
            // Balance validation for updated sell order
            // ----------------------------------------

            const availableBalance = balance - sumQuantityRemainingOpenOrders; // Available crypto after existing orders
            const orderQuantity = Number(order.quantityTotal);

            // Check if user has sufficient available crypto balance for the update
            if (orderQuantity > availableBalance) {
                throw new Error('Updated order quantity exceeds available balance');
            } else {
                return await this.update(userId, orderId, order);
            }
        }
    }

    async saveOrder(order, userId) {
        const { cryptocurrencyId, orderType, orderVariant, quantityTotal, price } = order;

        // Save order to database via repository
        const savedOrder = await this.orderRepository.save(
            cryptocurrencyId,
            orderType,
            orderVariant,
            quantityTotal,
            price,
            userId
        );

        return normaliseForOpenAPI(savedOrder);
    }
}

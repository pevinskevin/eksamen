import {
    validateCreateLimitOrder,
    validateCreateMarketOrder,
    validateOrderId,
    validateUpdateLimitOrder,
    validateMinimumLimitOrderValue,
    validateMinimumMarketOrderValue,
} from './orderValidators.js';
import { cryptoService, accountService } from '../../shared/factory/factory.js';
import { ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async setOrderStatusToCancelledByUserAndOrderId(userId, orderId) {
        // Validate that the orderId is in correct format
        validateOrderId(orderId);

        // Verify order exists and is in a state that allows deletion (open orders only)
        await this.getOpenOrderByUserAndOrderId(userId, orderId);

        // Proceed with deletion if validation passes
        const deletedOrder = await this.orderRepository.setStatusToCancelled(userId, orderId);

        return normaliseForOpenAPI(deletedOrder);
    }

    async getAll(userId) {
        const orderArray = await this.orderRepository.findAllAscending(userId);
        return normaliseForOpenAPI(orderArray);
    }

    async getOpenOrderByUserAndOrderId(userId, orderId) {
        console.log(userId, orderId);
        // Validate order ID format
        validateOrderId(orderId);

        // Fetch the order from database
        const order = await this.orderRepository.find(userId, orderId);

        // Check if order exists and is in a state that allows modification
        if (
            !order ||
            (order.status !== ORDER_STATUS.OPEN && order.status !== ORDER_STATUS.PARTIALLY_FILLED)
        ) {
            throw new Error('Order with ID ' + orderId);
        } else {
            return normaliseForOpenAPI(order);
        }
    }

    async update(userId, orderId, order) {
        const { cryptocurrencyId, initialQuantity, price, status } = order;

        // If initial_quantity is being updated, reset remaining_quantity to match
        // This assumes order modifications reset any partial fills
        let remainingQuantity = undefined;
        if (initialQuantity !== undefined) remainingQuantity = initialQuantity;

        const updatedOrder = await this.orderRepository.update(
            userId,
            orderId,
            cryptocurrencyId,
            initialQuantity,
            remainingQuantity,
            price,
            status
        );

        return normaliseForOpenAPI(updatedOrder);
    }

    async validateAndUpdateOrderByUserAndOrderId(userId, orderId, order) {
        // ==========================================
        // STEP 1: VALIDATION & SETUP
        // ==========================================

        // Validate update order format
        validateUpdateLimitOrder(order);

        // Get the original order to determine its variant and cryptocurrency
        const originalOrder = await this.getOpenOrderByUserAndOrderId(userId, orderId);
        const originalOrderVariant = originalOrder.orderVariant; // Not included in request body

        // Merge original order data with update data for complete validation
        const mergedOrder = {
            initialQuantity:
                order.initialQuantity !== undefined
                    ? order.initialQuantity
                    : originalOrder.initialQuantity,
            price: order.price !== undefined ? order.price : originalOrder.price,
        };

        // Validate minimum order value with complete data
        validateMinimumLimitOrderValue(mergedOrder);

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
                const remainingQuantity = Number(element.remaining_quantity);
                const price = Number(element.price);
                const orderValue = remainingQuantity * price; // USD value of this open order
                sumOrderValues += orderValue;
            });

            // ----------------------------------------
            // Balance validation for updated buy order
            // ----------------------------------------

            const availableBalance = balance - sumOrderValues; // Available USD after existing orders

            // Calculate USD value of the updated order using merged data
            const orderInitialQuantity = Number(mergedOrder.initialQuantity);
            const orderPrice = Number(mergedOrder.price);
            const orderValue = orderInitialQuantity * orderPrice;

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
            const orderQuantity = Number(mergedOrder.initialQuantity); // Use merged data

            // Check if user has sufficient available crypto balance for the update
            if (orderQuantity > availableBalance) {
                throw new Error('Updated order quantity exceeds available balance');
            } else {
                return await this.update(userId, orderId, order);
            }
        }
    }

    async saveOrder(order, userId) {
        const { cryptocurrencyId, orderType, orderVariant, initialQuantity, price, notionalValue } =
            order;

        // Save order to database via repository
        const savedOrder = await this.orderRepository.save(
            cryptocurrencyId,
            orderType,
            orderVariant,
            initialQuantity,
            price,
            userId,
            notionalValue
        );

        return normaliseForOpenAPI(savedOrder);
    }

    async validateAndSaveLimitOrder(order, userId) {
        // Validate limit order format and verify cryptocurrency exists
        validateCreateLimitOrder(order);
        validateMinimumLimitOrderValue(order);
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
                const remainingQuantity = Number(element.remaining_quantity);
                const price = Number(element.price);
                const orderValue = remainingQuantity * price; // USD value of this open order
                sumOrderValues += orderValue;
            });

            const availableBalance = balance - sumOrderValues; // Available USD after existing orders

            // Calculate USD value of the new order being placed
            const orderInitialQuantity = Number(order.initialQuantity);
            const orderPrice = Number(order.price);
            const orderValue = orderInitialQuantity * orderPrice;

            // Check if user has sufficient available balance
            if (orderValue > availableBalance) {
                throw new Error('Order value exceeds available balance');
            } else {
                // Add orderType for limit orders before saving
                const limitOrder = { ...order, orderType: 'limit' };
                return this.saveOrder(limitOrder, userId);
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
            const orderQuantity = Number(order.initialQuantity);

            // Check if user has sufficient available crypto balance
            if (orderQuantity > availableBalance) {
                throw new Error('Order quantity exceeds available balance');
            } else {
                // Add orderType for limit orders before saving
                const limitOrder = { ...order, orderType: 'limit' };
                return this.saveOrder(limitOrder, userId);
            }
        }
    }

    async validateAndSaveMarketOrder(order, userId) {
        // Validate market order format and verify cryptocurrency exists
        validateCreateMarketOrder(order);
        validateMinimumMarketOrderValue(order); // can't validate quantity for

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
                const remainingQuantity = Number(element.remaining_quantity);
                const price = Number(element.price);
                const orderValue = remainingQuantity * price; // USD value of this open order
                sumOrderValues += orderValue;
            });

            const availableBalance = balance - sumOrderValues; // Available USD after existing orders

            // For market orders, use notional_value instead of calculating totalValue
            const notionalValue = Number(order.notionalValue);

            // Check if user has sufficient available balance
            if (notionalValue > availableBalance) {
                throw new Error('Order notional value exceeds available balance');
            } else {
                // Add orderType for market orders and set quantity to null before saving (we don't know the quantity until order has been executed)
                order.initialQuantity = null;
                const marketOrder = { ...order, orderType: 'market' };
                return this.saveOrder(marketOrder, userId);
            }
        } else if (order.orderVariant === ORDER_VARIANT.SELL) {
            // Get the cryptocurrency symbol and user's holding balance
            const symbol = (await cryptoService.getCryptocurrencyById(order.cryptocurrencyId))
                .symbol;
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, symbol)
            ).balance;
            const balance = Number(stringBalance);
            console.log("User balance: " + balance);
            

            // Calculate crypto quantity tied up in existing open sell order
            // PostgreSQL SUM function returns result as string in sum property
            const stringSumQuantityRemainingOpenOrders = (
                await this.orderRepository.findAllOpenSellOrders(userId)
            ).sum;
            const sumOpenOrders = Number(stringSumQuantityRemainingOpenOrders);
            console.log("Sum open orders: " + sumOpenOrders);
            

            // Balance validation for new sell order

            const availableBalance = balance - sumOpenOrders; // Available crypto after existing orders
            const orderQuantity = Number(order.initialQuantity);
            console.log("available balance: " + availableBalance);
            

            // Check if user has sufficient available crypto balance
            if (orderQuantity > availableBalance) {
                throw new Error('Order quantity exceeds available balance');
            } else {
                // Add orderType for market orders and set notional value to null before saving. (we don't know the value until order has been executed))
                order.notionalValue = null;
                const marketOrder = { ...order, orderType: 'market' };
                return this.saveOrder(marketOrder, userId);
            }
        }
    }
}

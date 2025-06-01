import {
    validateCreateOrder,
    validateOrderId,
    validateUpdateOrder,
} from '../../shared/validators/orderValidators.js';
import { cryptoService, accountService } from '../../shared/factory/factory.js';
import { ORDER_TYPE, ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';

export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * DELETE ORDER BY USER AND ORDER ID
     *
     * Deletes a specific open order for a user after validation.
     * Only allows deletion of orders that are currently open (not cancelled or filled).
     *
     * @param {number} userId - The ID of the user who owns the order
     * @param {number} orderId - The ID of the order to delete
     * @returns {Promise} Result of the delete operation
     * @throws {Error} If order doesn't exist or is not in a deletable state
     */
    async deleteByUserAndOrderId(userId, orderId) {
        // Validate that the orderId is in correct format
        validateOrderId(orderId);

        // Verify order exists and is in a state that allows deletion (open orders only)
        await this.getOpenOrderByUserAndOrderId(userId, orderId);

        // Proceed with deletion if validation passes
        return await this.orderRepository.delete(userId, orderId);
    }

    /**
     * GET ALL ORDERS FOR USER
     *
     * Retrieves all orders (regardless of status) for a specific user,
     * sorted in ascending order by creation time or ID.
     *
     * @param {number} userId - The ID of the user whose orders to retrieve
     * @returns {Promise<Array>} Array of all user's orders
     */
    async getAll(userId) {
        return await this.orderRepository.findAllAscending(userId);
    }

    /**
     * GET OPEN ORDER BY USER AND ORDER ID
     *
     * Retrieves a specific order for a user, but only if it's in an "open" state.
     * Used for operations that should only work on active orders (updates, cancellations).
     *
     * @param {number} userId - The ID of the user who owns the order
     * @param {number} orderId - The ID of the order to retrieve
     * @returns {Promise<Object>} The order object if found and open
     * @throws {Error} If order doesn't exist, is cancelled, or fully filled
     */
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
            return order;
        }
    }

    async save(order, userId) {
        // --- NOTE: THIS NEEDS MAJOR REFACTORING - WILL BE PUT OFF FOR LATER DUE TO TIME CONSTRAINT ----

        // ==========================================
        // STEP 1: VALIDATION & SETUP
        // ==========================================

        // Validate order format and verify cryptocurrency exists
        validateCreateOrder(order);
        const cryptocurrency = await cryptoService.getCryptocurrencyById(order.cryptocurrencyId);

        // ==========================================
        // STEP 2: ROUTE BY ORDER TYPE & VARIANT
        // ==========================================

        if (order.orderType === ORDER_TYPE.LIMIT && order.orderVariant === ORDER_VARIANT.BUY) {
            // ========================================
            // BUY ORDER PROCESSING
            // ========================================

            // Get user's current fiat account balance (returned as string from service)
            const stringBalance = (await accountService.getFiatAccountByUserID(userId)).balance;
            const balance = Number(stringBalance);

            // ----------------------------------------
            // Calculate USD value tied up in existing open buy orders
            // ----------------------------------------

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

            // ----------------------------------------
            // Balance validation for new buy order
            // ----------------------------------------

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
        } else if (
            order.orderType === ORDER_TYPE.LIMIT &&
            order.orderVariant === ORDER_VARIANT.SELL
        ) {
            // ========================================
            // SELL ORDER PROCESSING
            // ========================================

            // Get the cryptocurrency symbol and user's holding balance
            const symbol = (await cryptoService.getCryptocurrencyById(order.cryptocurrencyId))
                .symbol;
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, symbol)
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
            // Balance validation for new sell order
            // ----------------------------------------

            const availableBalance = balance - sumQuantityRemainingOpenOrders; // Available crypto after existing orders
            const orderQuantity = Number(order.quantityTotal);

            // Check if user has sufficient available crypto balance
            if (orderQuantity > availableBalance) {
                throw new Error('Order quantity exceeds available balance');
            } else {
                return this.saveOrder(order, userId);
            }
        } else {
            // ========================================
            // OTHER ORDER TYPES (Market orders, etc.)
            // ========================================

            // For non-limit orders or other variants, proceed without balance checks
            return this.saveOrder(order, userId);
        }
    }

    /**
     * UPDATE ORDER (INTERNAL HELPER)
     *
     * Internal helper method that performs the actual database update operation.
     * This method assumes all validation has already been performed by the calling method.
     *
     * @param {number} userId - The ID of the user who owns the order
     * @param {number} orderId - The ID of the order to update
     * @param {Object} order - The order update data
     * @param {number} order.cryptocurrencyId - ID of the cryptocurrency
     * @param {string} order.quantityTotal - Total quantity as string
     * @param {string} order.price - Price as string
     * @param {string} order.status - New order status
     * @returns {Promise<Object>} Updated order object
     */
    async update(userId, orderId, order) {
        const { cryptocurrencyId, quantityTotal, price, status } = order;
        return await this.orderRepository.update(
            userId,
            orderId,
            cryptocurrencyId,
            quantityTotal,
            price,
            status
        );
    }

    async updateByUserAndOrderId(userId, orderId, order) {
        // ==========================================
        // STEP 1: VALIDATION & SETUP
        // ==========================================

        // Validate update order format
        validateUpdateOrder(order);

        // Get the original order to determine its variant and cryptocurrency
        const originalOrder = await this.getOpenOrderByUserAndOrderId(userId, orderId);
        const originalOrderVariant = originalOrder.order_variant; // Not included in request body

        // Get cryptocurrency symbol for sell order balance checks
        const originalOrderSymbol = (
            await cryptoService.getCryptocurrencyById(originalOrder.cryptocurrency_id)
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

    /**
     * SAVE ORDER (INTERNAL HELPER)
     *
     * Internal helper method that performs the actual database save operation.
     * This method assumes all validation and balance checks have been completed.
     * Handles the final step of persisting a validated order to the database.
     *
     * @param {Object} order - The validated order data to save
     * @param {number} order.cryptocurrencyId - ID of the cryptocurrency
     * @param {string} order.orderType - Type of order (LIMIT, MARKET)
     * @param {string} order.orderVariant - Variant of order (BUY, SELL)
     * @param {string} order.quantityTotal - Total quantity as string
     * @param {string} order.price - Price as string (optional for market orders)
     * @param {number} userId - The ID of the user placing the order
     * @returns {Promise<Object>} The saved order object with formatted price
     */
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

        // Format price for consistent API response
        // Market orders may not have a price, so default to '0.00'
        savedOrder.price = savedOrder.price?.toString() || '0.00';

        return savedOrder;
    }
}

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

    async deleteByUserAndOrderId(userId, orderId) {
        // validate order exists
        validateOrderId(orderId)
        await this.getOpenOrderByUserAndOrderId(userId, orderId);
        return await this.orderRepository.delete(userId, orderId);
    }

    async getAll(userId) {
        return await this.orderRepository.findAllAscending(userId);
    }

    async getOpenOrderByUserAndOrderId(userId, orderId) {
        validateOrderId(orderId);
        const order = await this.orderRepository.find(userId, orderId);
        if (
            !order ||
            order.status === ORDER_STATUS.CANCELLED ||
            order.status === ORDER_STATUS.FULLY_FILLED
        )
            throw new Error('Order with ID ' + orderId);
        else return order;
    }

    async save(order, userId) {
        //  -- 1. Validate order format and if cryptocurrency exists --
        validateCreateOrder(order);
        const cryptocurrency = await cryptoService.getCryptocurrencyById(order.cryptocurrencyId);

        //  -- 2. Check if buy or sell --
        if (order.orderType === ORDER_TYPE.LIMIT && order.orderVariant === ORDER_VARIANT.BUY) {
            // -- IF BUY --
            // 1. Get account balance.
            // 2. Get SUM USD of all OPEN buy orders.
            // 3. if SUM USD OPEN orders > account balance --> reject (402.)

            const stringBalance = (await accountService.getFiatAccountByUserID(userId)).balance; // returns balance as a string due to conversion in accountService
            const balance = Number(stringBalance);

            // Calculate total USD value of all open buy orders
            // 1. Initialize sum variable to track total USD value
            // 2. Fetch all open buy orders for the user
            // 3. For each order:
            //    - Convert quantity_remaining and price from strings to numbers (stored as strings in DB)
            //    - Calculate USD value (quantity * price)
            //    - Add to running sum
            let sumOrderValues = 0;
            const arrayOpenOrders = await this.orderRepository.findAllOpenBuyOrders(userId);
            arrayOpenOrders.forEach((element) => {
                const quantityRemaining = Number(element.quantity_remaining);
                const price = Number(element.price);
                const orderValue = quantityRemaining * price;
                sumOrderValues += orderValue;
            });

            const availableBalance = balance - sumOrderValues;

            const orderQuantityTotal = Number(order.quantityTotal);
            const orderPrice = Number(order.price);
            const orderValue = orderQuantityTotal * orderPrice;

            if (orderValue > availableBalance)
                throw new Error('Order value exceeds available balance');
            else return this.saveOrder(order, userId);
        } else if (
            order.orderType === ORDER_TYPE.LIMIT &&
            order.orderVariant === ORDER_VARIANT.SELL
        ) {
            // -- IF SELL --
            // 1. Get crypto holding balance.
            // 2. Get SUM crypto of all OPEN sell orders.
            // 3. if order quantityTotal > available balance --> reject (402.)

            const symbol = (await cryptoService.getCryptocurrencyById(order.cryptocurrencyId))
                .symbol;
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, symbol)
            ).balance;
            const balance = Number(stringBalance);

            const stringSumQuantityRemainingOpenOrders = (
                await this.orderRepository.findAllOpenSellOrders(userId)
            ).sum; // postgresql SUM function returns string in sum object.

            const sumQuantityRemainingOpenOrders = Number(stringSumQuantityRemainingOpenOrders);

            const availableBalance = balance - sumQuantityRemainingOpenOrders;

            const orderQuantity = Number(order.quantityTotal);

            if (orderQuantity > availableBalance)
                throw new Error('Order quantity exceeds available balance');
            else return this.saveOrder(order, userId);
        } else return this.saveOrder(order, userId);
    }

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
        //  -- 1. Validate order format and if cryptocurrency exists --
        validateUpdateOrder(order);
        const originalOrder = await this.getOpenOrderByUserAndOrderId(userId, orderId);
        const originalOrderVariant = originalOrder.order_variant; // order variant is not included in request body.
        const originalOrderSymbol = (
            await cryptoService.getCryptocurrencyById(originalOrder.cryptocurrency_id)
        ).symbol; // crypto symbol is not included in request body.

        if (originalOrderVariant === ORDER_VARIANT.BUY) {
            // -- IF BUY --
            // 1. Get account balance.
            // 2. Get SUM USD of all OPEN buy orders.
            // 3. if SUM USD OPEN orders > account balance --> reject (402.)

            const stringBalance = (await accountService.getFiatAccountByUserID(userId)).balance; // returns balance as a string due to conversion in accountService
            const balance = Number(stringBalance);

            // Calculate total USD value of all open buy orders
            // 1. Initialize sum variable to track total USD value
            // 2. Fetch all open buy orders for the user
            // 3. For each order:
            //    - Convert quantity_remaining and price from strings to numbers (stored as strings in DB)
            //    - Calculate USD value (quantity * price)
            //    - Add to running sum
            let sumOrderValues = 0;
            const arrayOpenOrders = await this.orderRepository.findAllOpenBuyOrders(userId);
            arrayOpenOrders.forEach((element) => {
                const quantityRemaining = Number(element.quantity_remaining);
                const price = Number(element.price);
                const orderValue = quantityRemaining * price;
                sumOrderValues += orderValue;
            });

            const availableBalance = balance - sumOrderValues;

            const orderQuantityTotal = Number(order.quantityTotal);
            const orderPrice = Number(order.price);
            const orderValue = orderQuantityTotal * orderPrice;

            if (orderValue > availableBalance)
                throw new Error('Updated order value exceeds available balance');
            else return await this.update(userId, orderId, order);
        } else if (originalOrderVariant === ORDER_VARIANT.SELL) {
            // -- IF SELL --
            // 1. Get crypto holding balance.
            // 2. Get SUM crypto of all OPEN sell orders.
            // 3. if order quantityTotal > available balance --> reject (402.)
            const stringBalance = (
                await accountService.getCryptoHoldingByUserIdAndSymbol(userId, originalOrderSymbol)
            ).balance;
            const balance = Number(stringBalance);

            const stringSumQuantityRemainingOpenOrders = (
                await this.orderRepository.findAllOpenSellOrders(userId)
            ).sum; // postgresql SUM function returns string in sum object.

            const sumQuantityRemainingOpenOrders = Number(stringSumQuantityRemainingOpenOrders);

            const availableBalance = balance - sumQuantityRemainingOpenOrders;

            const orderQuantity = Number(order.quantityTotal);

            if (orderQuantity > availableBalance)
                throw new Error('Updated order quantity exceeds available balance');
            else return await this.update(userId, orderId, order);
        }
    }

    async saveOrder(order, userId) {
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

import { validateCreateOrder, validateOrderId } from '../../shared/validators/orderValidators.js';
import { cryptoService, accountService } from '../../shared/factory/factory.js';
import { ORDER_TYPE, ORDER_VARIANT } from '../../shared/validators/validators.js';

export default class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async deleteByOrderId(userId, orderId) {
        return await this.orderRepository.delete(userId, orderId);
    }

    async getAll(userId) {
        return await this.orderRepository.findAllAscending(userId);
    }

    async getByOrderId(userId, orderId) {
        validateOrderId(orderId);
        return await this.orderRepository.find(userId, orderId);
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

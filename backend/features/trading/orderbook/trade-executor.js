import db from '../../../database/connection.js';
import { tradeNotificationEmitter } from '../../../shared/events/tradeNotificationEmitter.js';

import {
    accountRepository,
    orderRepository,
    tradeRepository,
} from '../../../shared/factory/factory.js';

import { ORDER_STATUS, ORDER_VARIANT } from '../../../shared/validators/validators.js';

export async function executeTradeAgainstBinance(
    orderId, // ID of the order being processed
    userId, // ID of the user who placed the order
    cryptocurrencyId, // ID of the crypto being traded
    orderVariant, // 'BUY' or 'SELL'
    orderQuantity, // The total quantity of the original order
    executionPrice // The price from getBestPrice (best ask for BUY, best bid for SELL)
) {
    try {
        await db.query('BEGIN');
        const BINANCE_USER_ID = 999;

        if (orderVariant === ORDER_VARIANT.BUY) {
            const totalCost = orderQuantity * executionPrice;

            // 1. Update user's fiat balance
            const increment = -totalCost;
            await accountRepository.incrementFiatAccount(userId, increment);

            // 2. Update user's crypto holding
            await accountRepository.incrementCryptoHolding(userId, cryptocurrencyId, orderQuantity);

            // 3. Record trade in db.
            const buyerUserId = userId;
            const sellerUserId = BINANCE_USER_ID;
            await tradeRepository.create(
                orderId,
                cryptocurrencyId,
                orderQuantity,
                executionPrice,
                buyerUserId,
                sellerUserId
            );
            console.log('Trade executed. Gj Kevin.');
        } else if (orderVariant === ORDER_VARIANT.SELL) {
            // 1. Update user's crypto holding
            const increment = -orderQuantity;
            await accountRepository.incrementCryptoHolding(userId, cryptocurrencyId, increment);

            // 2. Update user's fiat balance
            const totalValueIncrement = orderQuantity * executionPrice;
            await accountRepository.incrementFiatAccount(userId, totalValueIncrement);

            // 3. Record trade in db.
            const buyerUserId = BINANCE_USER_ID;
            const sellerUserId = userId;
            await tradeRepository.create(
                orderId,
                cryptocurrencyId,
                orderQuantity,
                executionPrice,
                buyerUserId,
                sellerUserId
            );
        }
        // Update Order.
        orderQuantity = null;
        const quantityRemaining = 0;
        const status = ORDER_STATUS.FULLY_FILLED;
        const updatedOrder = await orderRepository.update(
            userId,
            orderId,
            cryptocurrencyId,
            orderQuantity,
            quantityRemaining,
            executionPrice,
            status
        );
        await db.query('COMMIT');
        tradeNotificationEmitter.emit('tradeExecuted', updatedOrder);
    } catch (error) {
        console.log('Error: ' + error.message);
        return await db.query('ROLLBACK');
    }
}

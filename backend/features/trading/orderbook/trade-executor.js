import db from '../../../database/connection.js';
import { tradeNotificationEmitter } from '../../../shared/events/tradeNotificationEmitter.js';
import Decimal from 'decimal.js';
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
    tradeQuantity,
    notionalValue, // The quantity to be traded (usually remainingQuantity for market orders)
    priceAndDepthArrayForConsumption // The price from getBestPrice (best ask for BUY, best bid for SELL)
) {
    try {
        await db.query('BEGIN');
        const BINANCE_USER_ID = 999;
        let executionPrice;

        if (orderVariant === ORDER_VARIANT.BUY) {
            let remainingValue = new Decimal(notionalValue);
            let sumQuantity = new Decimal(0);
            for (const element of priceAndDepthArrayForConsumption) {
                const price = new Decimal(element[0]);

                const quantity = new Decimal(element[1]);
                const askValue = new Decimal(price.mul(quantity));
                if (remainingValue.gte(askValue)) {
                    sumQuantity = sumQuantity.plus(quantity);
                    remainingValue = remainingValue.minus(askValue);
                    continue;
                }
                if (remainingValue.lessThanOrEqualTo(0)) break;
                else {
                    const askPartialFillQuantity = new Decimal(
                        remainingValue.div(askValue).mul(quantity)
                    );
                    sumQuantity = sumQuantity.plus(askPartialFillQuantity);
                    remainingValue = new Decimal(0);
                    break;
                }
            }
            const executionPrice = new Decimal(notionalValue).div(sumQuantity);


            // 1. Update user's fiat balance
            const increment = -notionalValue;
            await accountRepository.incrementFiatAccount(userId, increment);

            // 2. Update user's crypto holding
            await accountRepository.incrementCryptoHolding(
                userId,
                cryptocurrencyId,
                sumQuantity.toNumber()
            );

            // 3. Record trade in db.
            const buyerUserId = userId;
            const sellerUserId = BINANCE_USER_ID;
            await tradeRepository.create(
                orderId,
                cryptocurrencyId,
                sumQuantity.toNumber(),
                executionPrice.toNumber(),
                buyerUserId,
                sellerUserId
            );

        } else if (orderVariant === ORDER_VARIANT.SELL) {
            let remainingQuantity = new Decimal(tradeQuantity);
            let sumValue = new Decimal(0);
            for (const element of priceAndDepthArrayForConsumption) {
                const price = new Decimal(element[0]);
                const quantity = new Decimal(element[1]);
                const askValue = new Decimal(price.mul(quantity));
                if (remainingQuantity.gte(quantity)) {
                    sumValue = sumValue.plus(askValue);
                    remainingQuantity = remainingQuantity.minus(quantity);
                    continue;
                }
                if (remainingQuantity.lessThanOrEqualTo(0)) break;
                else {
                    const bidPartialFillQuantity = new Decimal(
                        remainingQuantity.div(quantity).mul(quantity)
                    );
                    sumValue = sumValue.plus(bidPartialFillQuantity.mul(price));
                    remainingQuantity = new Decimal(0);
                    break;
                }
            }
            executionPrice = sumValue.toNumber() / tradeQuantity;

            // 1. Update user's crypto holding
            const increment = -tradeQuantity;
            await accountRepository.incrementCryptoHolding(userId, cryptocurrencyId, increment);

            // 2. Update user's fiat balance
            const totalValueIncrement = sumValue.toNumber();
            await accountRepository.incrementFiatAccount(userId, totalValueIncrement);

            // 3. Record trade in db.
            const buyerUserId = BINANCE_USER_ID;
            const sellerUserId = userId;
            await tradeRepository.create(
                orderId,
                cryptocurrencyId,
                tradeQuantity,
                executionPrice,
                buyerUserId,
                sellerUserId,
            );
        }
        // Update Order - mark as fully filled
        const remainingQuantity = 0;
        const status = ORDER_STATUS.FULLY_FILLED;
        const updatedOrder = await orderRepository.update(
            userId,
            orderId,
            cryptocurrencyId,
            null, // initialQuantity - keep original value
            remainingQuantity,
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

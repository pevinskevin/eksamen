import { marketOrderEmitter } from '../../../shared/events/marketOrderEmitter.js';
import { getBestPrice } from './binance-ws.js';
import { cryptoService } from '../../../shared/factory/factory.js';
import { ORDER_VARIANT } from '../../../shared/validators/validators.js';
import { executeTradeAgainstBinance } from './trade-executor.js';

function getSymbolUsingCryptoIDAndCatWithUSDT(cryptocurrencyId) {
    const symbol = cryptoService.getCryptocurrencyById(cryptocurrencyId).symbol;
    const symbolUSDT = symbol + 'USDT';
    return symbolUSDT;
}

marketOrderEmitter.on('marketOrderCreated', async (eventData) => {
    console.log('market emitter has received order');

    const { order } = eventData;
    if (!order) {
        console.error('[MarketOrderEngine] Event data did not contain an order object.');
        return;
    }

    const { id: orderId, userId, cryptocurrencyId, orderVariant, quantityRemaining } = order;

    if (
        !orderId ||
        !userId ||
        !cryptocurrencyId ||
        !orderVariant ||
        quantityRemaining === undefined
    ) {
        console.error(
            '[MarketOrderEngine] Received order with missing essential properties:',
            order
        );
        return;
    }

    const symbol = getSymbolUsingCryptoIDAndCatWithUSDT(cryptocurrencyId);

    const priceData = getBestPrice(symbol);

    if (!priceData) {
        console.error(
            `[MarketOrderEngine] No price data found for symbol ${symbol}. Order ID: ${orderId}`
        );
        return;
    }

    const executionPrice = orderVariant === ORDER_VARIANT.BUY ? priceData.ask : priceData.bid;

    if (!executionPrice || executionPrice === undefined || parseFloat(executionPrice) <= 0) {
        console.error(
            `[MarketOrderEngine] Invalid or zero execution price for symbol ${symbol} (ask: ${priceData.ask}, bid: ${priceData.bid}). Order ID: ${orderId}`
        );
        return;
    }

    console.log(
        `[MarketOrderEngine] Preparing to execute trade. Order ID: ${orderId}, User ID: ${userId}, Crypto ID: ${cryptocurrencyId}, Symbol: ${symbol}, Variant: ${orderVariant}, Quantity: ${quantityRemaining}, Execution Price: ${executionPrice}`
    );

    try {
        await executeTradeAgainstBinance(
            orderId,
            userId,
            cryptocurrencyId,
            orderVariant,
            quantityRemaining,
            parseFloat(executionPrice)
        );
        console.log(
            `[MarketOrderEngine] Successfully called executeTradeAgainstBinance for Order ID: ${orderId}`
        );
    } catch (error) {
        console.error(
            `[MarketOrderEngine] Error during executeTradeAgainstBinance for Order ID: ${orderId}:`,
            error
        );
    }
});

// Needs to be able to account for both limit and market orders.

// Should trades be received by websocket?
// 1. orderRouter publishes event.
// 2. market-order-engine receives event.
// 3. deconstruct the data.
// 4. creates a trade by calling a trade-function.
// 5. trade should send/emit return error or success. Maybe fault codes.
// 5. When trade is submitted/emited, update order status by calling order put endpoint.
// 5.1 It's closed or partially filled depending on quantity?
// 6. when order status is updated, create db trade entry.
// 7. Websocket trade status whatever to frontend?
//
//
//
//
//
//
//
//
//
//
//
//
//

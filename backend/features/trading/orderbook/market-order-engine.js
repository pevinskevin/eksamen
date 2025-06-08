import { marketOrderEmitter } from '../../../shared/events/marketOrderEmitter.js';
import { getTinyOrderBook } from './binance-ws.js';
import { cryptoRepository } from '../../../shared/factory/factory.js';
import { ORDER_VARIANT } from '../../../shared/validators/validators.js';
import { executeTradeAgainstBinance } from './trade-executor.js';

function normaliseSymbolToUsdt(symbol) {
    return symbol + 'USDT';
}

marketOrderEmitter.on('marketOrderCreated', async (eventData) => {
    console.log('market emitter has received order');

    const { order } = eventData;
    const { id: orderId, userId, cryptocurrencyId, orderVariant, remainingQuantity, notionalValue } = order;

    const symbol = await cryptoRepository.findSymbolById(cryptocurrencyId);
    const binanceSymbol = normaliseSymbolToUsdt(symbol);
    const priceData = getTinyOrderBook(`${binanceSymbol}`);

    if (!priceData) {
        console.error(
            `[MarketOrderEngine] No price data found for symbol ${binanceSymbol}. Order ID: ${orderId}`
        );
        return;
    }

    const priceAndDepthArrayForConsumption =
        orderVariant === ORDER_VARIANT.BUY ? priceData.asks : priceData.bids;

    console.log(`[MarketOrderEngine] Preparing to execute trade. Order ID: ${orderId}`);

    try {
        await executeTradeAgainstBinance(
            orderId,
            userId,
            cryptocurrencyId,
            orderVariant,
            remainingQuantity,
            notionalValue,
            priceAndDepthArrayForConsumption
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

// marketOrderEmitter.on('marketOrderCreated', async (eventData) => {
//     console.log('market emitter has received order');
//     const { order } = eventData;
//     const { id: orderId, userId, cryptocurrencyId, orderVariant, quantityRemaining } = order;
//     const symbol = await getSymbolUsingCryptoIDAndCatWithUSDT(cryptocurrencyId);
//     const priceData = getBestPrice(symbol);

//     if (!priceData) {
//         console.error(
//             `[MarketOrderEngine] No price data found for symbol ${symbol}. Order ID: ${orderId}`
//         );
//         return;
//     }

//     const executionPrice = orderVariant === ORDER_VARIANT.BUY ? priceData.ask : priceData.bid;
//     console.log('Price data: ' + priceData.ask);

//     console.log('Execution price: ' + executionPrice);

//     console.log(`[MarketOrderEngine] Preparing to execute trade. Order ID: ${orderId}`);

//     try {
//         await executeTradeAgainstBinance(
//             orderId,
//             userId,
//             cryptocurrencyId,
//             orderVariant,
//             quantityRemaining,
//             parseFloat(executionPrice)
//         );
//         console.log(
//             `[MarketOrderEngine] Successfully called executeTradeAgainstBinance for Order ID: ${orderId}`
//         );
//     } catch (error) {
//         console.error(
//             `[MarketOrderEngine] Error during executeTradeAgainstBinance for Order ID: ${orderId}:`,
//             error
//         );
//     }
// });

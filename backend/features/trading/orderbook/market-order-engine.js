import { marketOrderEmitter } from '../../../shared/events/marketOrderEmitter.js';
import { getTinyOrderBook } from './binance-ws.js';
import { cryptoRepository } from '../../../shared/factory/factory.js';
import { ORDER_VARIANT } from '../../../shared/validators/validators.js';
import { executeTradeAgainstBinance } from './trade-executor.js';

function normaliseSymbolToUsdt(symbol) {
    return symbol + 'USDT';
}

marketOrderEmitter.on('marketOrderCreated', async (eventData) => {


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
    } catch (error) {
        console.error(
            `[MarketOrderEngine] Error during executeTradeAgainstBinance for Order ID: ${orderId}:`,
            error
        );
    }
});

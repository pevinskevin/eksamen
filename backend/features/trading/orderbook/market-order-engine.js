import { marketOrderEmitter } from '../../../shared/events/marketOrderEmitter.js';
import { getBestPrice } from './binance-ws.js';
import { cryptoService } from '../../../shared/factory/factory.js';
import { ORDER_VARIANT } from '../../../shared/validators/validators.js';

function catSymbolUSDT(cryptocurrencyId) {
    const symbol = cryptoService.getCryptocurrencyBySymbol(cryptocurrencyId);
    const symbolUSDT = symbol + 'USDT';
    return symbolUSDT;
}

function orderVariantToSideTransformer(orderVariant) {
    if (orderVariant === ORDER_VARIANT.BUY) return 'bids';
    else return 'asks';
}

function executeTradeAgainstBinance(order, executionPrice) {}

marketOrderEmitter.on('marketOrderCreated', async (order) => {
    const { id, userId, cryptocurrencyId, orderVariant, quantityRemaining, status } = order;
    const symbol = catSymbolUSDT(orderData.cryptocyrrencyId);

    const executionPrice = getBestPrice(symbol);

    
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

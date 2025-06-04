import Binance from 'node-binance-api';
import { EventEmitter } from 'events';

// ---- -----

const binance = new Binance({
    useServerTime: true,
    recvWindow: 60000,
    log: console.log,
});

// ---- -----

const symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'BNBUSDT', 'SOLUSDT'];

// ---- -----

export const marketDataEmitter = new EventEmitter();
const priceCache = new Map();

// ---- -----

const tinyOrderBook = new Map();
// ---- -----

binance.websockets.depthCache(symbols, (symbol, depth) => {
    // ---- -----
    // Best price "Orderbook"
    const bestBid = binance.first(depth.bids);
    const bestAsk = binance.first(depth.asks);
    const bestPrice = { bid: bestBid, ask: bestAsk };
    priceCache.set(symbol, bestPrice);
    marketDataEmitter.emit('bestPriceUpdate', { symbol, ...bestPrice });
    // ---- -----

    // ---- -----
    const bids = Object.entries(binance.sortBids(depth.bids, 10, 'cumulative'));
    const asks = Object.entries(binance.sortAsks(depth.asks, 10, 'cumulative'));
    console.log(Object.entries(bids));

    tinyOrderBook.set(symbol, combined);

    // ---- -----
});

// ---- -----

export function getBestPrice(symbol) {
    return priceCache.get(symbol);
}

export function getAllPrices() {
    return Object.fromEntries(priceCache);
}

export function isPriceDataAvailable(symbol) {
    return priceCache.has(symbol);
}

// ---- -----

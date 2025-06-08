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
let depthCacheEndpoints = []; // Track WebSocket endpoints for cleanup

// ---- -----

const endpoints = binance.websockets.depthCache(symbols, (symbol, depth) => {
    // // ---- -----
    // // Best price "Orderbook"
    // const bestBid = binance.first(depth.bids);
    // const bestAsk = binance.first(depth.asks);
    // const bestPrice = { bid: bestBid, ask: bestAsk };
    // priceCache.set(symbol, bestPrice);
    // // ---- -----

    // ---- -----

    //     {
    //     bids: {
    //         "45000.00": 1.5,    // price: quantity
    //         "44999.99": 0.8,
    //     },
    //     asks: {
    //         "45000.01": 0.9,
    //         "45000.02": 1.2,
    //     },
    // }
    // converts each property to nested array [[price, quantity]].
    const bids = Object.entries(binance.sortBids(depth.bids, 1000)); // 1000 properties.
    const asks = Object.entries(binance.sortAsks(depth.asks, 1000));
    const bidsArr = bids.map((element) => {
        element[0] = Number(element[0]);
        return element;
    });
    const asksArr = asks.map((element) => {
        element[0] = Number(element[0]);
        return element;
    });

    tinyOrderBook.set(symbol, { asks: asksArr, bids: bidsArr });
    // Emits data to front-end
    // marketDataEmitter.emit('orderBookDepthUpdate', { symbol });
    // ---- -----
});

// Store endpoints for cleanup
depthCacheEndpoints = Array.isArray(endpoints) ? endpoints : [endpoints];

// Cleanup function to close WebSocket connections
export function cleanup() {
    console.log('Closing Binance WebSocket connections...');

    // Close all depth cache endpoints
    depthCacheEndpoints.forEach((endpoint) => {
        if (endpoint && typeof binance.websockets.terminate === 'function') {
            try {
                binance.websockets.terminate(endpoint);
            } catch (error) {
                console.log('Error closing WebSocket endpoint:', error.message);
            }
        }
    });

    // Clear all event listeners
    marketDataEmitter.removeAllListeners();

    // Clear caches
    priceCache.clear();
    tinyOrderBook.clear();

    console.log('Binance WebSocket cleanup completed');
}

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

export function getTinyOrderBook(symbol) {
    try {
        return tinyOrderBook.get(symbol);
    } catch (error) {
        console.log('Error returning tiny orderbook: ' + error.message);
    }
}

// ---- -----

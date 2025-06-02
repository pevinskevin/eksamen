import Binance from 'node-binance-api';
import { EventEmitter } from 'events';

const marketDataEmitter = new EventEmitter();

// ---- -----

const binance = new Binance({
    useServerTime: true,
    recvWindow: 60000,
    log: console.log,
});

// ---- -----

const symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'BNBUSDT', 'SOLUSDT'];
const priceCache = new Map();

// ---- -----

binance.websockets.depthCache(symbols, (symbol, depth) => {
    const bestBid = binance.first(depth.bids);
    const bestAsk = binance.first(depth.asks);
    const bestPrice = { bid: bestBid, ask: bestAsk };

    priceCache.set(symbol, bestPrice);
    marketDataEmitter.emit('bestPriceUpdate', { symbol, ...bestPrice });
});

// ---- -----

function getBestPrice(symbol) {
    return priceCache.get(symbol);
}

function getAllPrices() {
    return Object.fromEntries(priceCache);
}

function isPriceDataAvailable(symbol) {
    return priceCache.has(symbol);
}

// ---- -----

export { marketDataEmitter, getBestPrice, getAllPrices, isPriceDataAvailable };

// ---- -----

// // Old.
// binance.websockets.depthCache(
//     tradingPairs[0],
//     (symbol, depth) => {
//         const aggregatedBidsInOneDollarIncrements = new Map();
//         const aggregatedAsksInOneDollarIncrements = new Map();

//         let bidsArrayForDisplay = [];
//         let asksArrayForDisplay = [];

//         function pushToBidsArrayForDisplay(value, key) {
//             bidsArrayForDisplay.push({ priceband: key, quantity: value });
//         }
//         function pushToAsksArrayForDisplay(value, key) {
//             asksArrayForDisplay.push({ priceband: key, quantity: value });
//         }

//         // Takes nested array, aggregates order quantities in one dollar incremenets and pushes to map.
//         function floorPriceAndAggregateQuantity(array, map) {
//             array.forEach((element) => {
//                 const flooredPrice = Math.floor(Number(element[0]));
//                 const quantity = element[1];

//                 if (map.has(flooredPrice)) {
//                     let value = map.get(flooredPrice);
//                     map.set(flooredPrice, value + quantity);
//                 } else {
//                     map.set(flooredPrice, quantity);
//                 }
//             });
//         }

//         const bidsObject = binance.sortBids(depth.bids, Infinity);
//         const askObject = binance.sortAsks(depth.asks, Infinity);

//         // structure [ [String price, Number orderQuantity], [String price, Number orderQuantity]... ]
//         const bidsArray = Object.entries(bidsObject);
//         floorPriceAndAggregateQuantity(bidsArray, aggregatedBidsInOneDollarIncrements);
//         aggregatedBidsInOneDollarIncrements.forEach(pushToBidsArrayForDisplay);

//         const asksArray = Object.entries(askObject);
//         floorPriceAndAggregateQuantity(asksArray, aggregatedAsksInOneDollarIncrements);
//         aggregatedAsksInOneDollarIncrements.forEach(pushToAsksArrayForDisplay);

//         const dataToEmit = { bids: bidsArrayForDisplay, asks: asksArrayForDisplay };

//         marketDataEmitter.emit('marketUpdate', dataToEmit);
//     },
//     10000
// );

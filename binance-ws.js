import Binance from 'node-binance-api';
import { EventEmitter } from 'events';

const binance = new Binance({
    useServerTime: true,
    recvWindow: 60000,
    log: console.log,
});

const marketDataEmitter = new EventEmitter();
let currentMarketDepth = {};
let bidsArrayForDisplay = [];

const tradingPairs = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'BNBUSDT', 'SOLUSDT'];

let bidsArray;
let asksArray;

binance.websockets.depthCache(
    tradingPairs[0],
    (symbol, depth) => {
        const aggregatedBids = new Map();
        bidsArrayForDisplay = [];

        function loopMapElements(value, key, map) {
            bidsArrayForDisplay.push({ priceband: key, quantity: value });
        }

        const bidsObject = binance.sortBids(depth.bids, Infinity);
        const askObject = binance.sortAsks(depth.asks, Infinity);
        currentMarketDepth = { bids: bidsObject, asks: askObject };

        bidsArray = Object.entries(bidsObject);
        asksArray = Object.entries(askObject);

        bidsArray.forEach((element) => {
            const priceInNearestDollar = Math.floor(Number(element[0]));
            const quantity = element[1];

            if (aggregatedBids.has(priceInNearestDollar)) {
                let key = aggregatedBids.get(priceInNearestDollar);
                aggregatedBids.set(priceInNearestDollar, key + quantity);
            } else {
                aggregatedBids.set(priceInNearestDollar, quantity);
            }
        });

        aggregatedBids.forEach(loopMapElements);
        console.log(bidsArrayForDisplay.length);

        marketDataEmitter.emit('marketUpdate', bidsArrayForDisplay);

        // bidsMap.forEach((price, quantity) => {
        //     sortBids(price, quantity);
        // });

        // console.log(aggregatedBids);
    },
    10000
);

function getOrderBook() {
    return currentMarketDepth;
}

function getOrderBookAggregate() {
    return bidsArrayForDisplay;
}

export { getOrderBook, getOrderBookAggregate, binance, marketDataEmitter };

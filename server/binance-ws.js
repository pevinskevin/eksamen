import Binance from 'node-binance-api';
import { EventEmitter } from 'events';

const binance = new Binance({
    useServerTime: true,
    recvWindow: 60000,
    log: console.log,
});

const marketDataEmitter = new EventEmitter();

const tradingPairs = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'BNBUSDT', 'SOLUSDT'];

binance.websockets.depthCache(
    tradingPairs[0],
    (symbol, depth) => {
        const aggregatedBidsInOneDollarIncrements = new Map();
        const aggregatedAsksInOneDollarIncrements = new Map();

        let bidsArrayForDisplay = [];
        let asksArrayForDisplay = [];

        function loopBidsElements(value, key) {
            bidsArrayForDisplay.push({ priceband: key, quantity: value });
        }
        function loopAsksElements(value, key) {
            asksArrayForDisplay.push({ priceband: key, quantity: value });
        }

        // Takes nested array, aggregates values and pushes to map.
        function floorPriceAndAggregateQuantity(array, map) {
            array.forEach((element) => {
                const flooredPrice = Math.floor(Number(element[0]));
                const quantity = element[1];

                if (map.has(flooredPrice)) {
                    let value = map.get(flooredPrice);
                    map.set(flooredPrice, value + quantity);
                } else {
                    map.set(flooredPrice, quantity);
                }
            });
        }

        const bidsObject = binance.sortBids(depth.bids, Infinity);
        const askObject = binance.sortAsks(depth.asks, Infinity);

        // structure [ [String price, Number quantity], [String price, Number quantity]... ]
        let bidsArray = Object.entries(bidsObject);
        floorPriceAndAggregateQuantity(bidsArray, aggregatedBidsInOneDollarIncrements);

        let asksArray = Object.entries(askObject);
        floorPriceAndAggregateQuantity(asksArray, aggregatedAsksInOneDollarIncrements);

        aggregatedBidsInOneDollarIncrements.forEach(loopBidsElements);
        aggregatedAsksInOneDollarIncrements.forEach(loopAsksElements);
        let dataToEmit = { bids: bidsArrayForDisplay, asks: asksArrayForDisplay };

        marketDataEmitter.emit('marketUpdate', dataToEmit);
    },
    10000
);

export { binance, marketDataEmitter };

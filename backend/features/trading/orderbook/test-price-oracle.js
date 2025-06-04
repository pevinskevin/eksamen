import {
    getBestPrice,
    getAllPrices,
    isPriceDataAvailable,
    marketDataEmitter,
} from './binance-ws.js';

console.log('Testing Price Oracle...');

marketDataEmitter.on('bestPriceUpdate', (data) => {
    console.log(`📈 ${data.symbol}: Bid=${data.bid}, Ask=${data.ask}`);
});

setTimeout(() => {
    console.log('\n=== Current Prices ===');
    console.log('BTC Price:', getBestPrice('BTCUSDT'));
    console.log('All Prices:', getAllPrices());
    console.log('Has ETH data:', isPriceDataAvailable('ETHUSDT'));
}, 5000);

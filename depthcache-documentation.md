# WebSocket DepthCache Documentation

## Overview

The DepthCache functionality provides real-time order book data through WebSocket connections. It maintains a local cache of bids and asks for one or more trading symbols, automatically synchronized with Binance's order book updates.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [API Reference](#api-reference)
3. [Advanced Features](#advanced-features)
4. [Best Practices](#best-practices)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Basic Usage

### Single Symbol DepthCache

```javascript
import Binance from 'node-binance-api';

const binance = new Binance({
    APIKEY: 'your-api-key',
    APISECRET: 'your-api-secret'
});

// Subscribe to BTCUSDT depth cache
binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const bids = binance.sortBids(depth.bids);
    const asks = binance.sortAsks(depth.asks);
    
    console.log(`${symbol} depth cache update`);
    console.log('Best bid:', binance.first(bids));
    console.log('Best ask:', binance.first(asks));
    console.log('Last updated:', new Date(depth.eventTime));
});
```

### Multiple Symbols DepthCache

```javascript
// Subscribe to multiple symbols
const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
binance.websockets.depthCache(symbols, (symbol, depth) => {
    console.log(`${symbol} order book updated`);
    // Process each symbol's depth data
});
```

## API Reference

### Main Methods

#### `depthCache(symbols, callback, limit)`

Subscribes to real-time order book data for specified symbols.

**Parameters:**
- `symbols` (string | string[]): Single symbol or array of symbols
- `callback` (function): Callback function called on each update
- `limit` (number, optional): Number of price levels to retrieve (default: 500)

**Returns:** WebSocket endpoint URL

#### `depthCacheStaggered(symbols, callback, limit, stagger)`

Creates staggered depth cache subscriptions to avoid rate limiting.

**Parameters:**
- `symbols` (string[]): Array of symbols to subscribe to
- `callback` (function): Callback function for updates
- `limit` (number, optional): Number of price levels (default: 100)
- `stagger` (number, optional): Milliseconds between subscriptions (default: 200)

**Returns:** Promise that resolves when all subscriptions are established

#### `clearDepthCache(symbols)`

Clears the depth cache for specified symbols.

**Parameters:**
- `symbols` (string | string[]): Symbol(s) to clear from cache

### Utility Methods

#### `sortBids(symbol, max, baseValue)`

Returns sorted bid orders (highest price first).

**Parameters:**
- `symbol` (string | object): Symbol name or bid object
- `max` (number, optional): Maximum number of orders (default: Infinity)
- `baseValue` (string, optional): 'cumulative' or undefined

#### `sortAsks(symbol, max, baseValue)`

Returns sorted ask orders (lowest price first).

**Parameters:**
- `symbol` (string | object): Symbol name or ask object
- `max` (number, optional): Maximum number of orders (default: Infinity)
- `baseValue` (string, optional): 'cumulative' or undefined

#### `depthVolume(symbol)`

Calculates total bid/ask volume and quantities.

**Returns:**
```javascript
{
    bids: number,     // Total bid base volume
    asks: number,     // Total ask base volume
    bidQty: number,   // Total bid quantity
    askQty: number    // Total ask quantity
}
```

#### `first(object)` / `last(object)`

Gets the first/last property of an object (best bid/ask).

#### `getDepthCache(symbol)`

Retrieves the current depth cache for a symbol.

**Returns:**
```javascript
{
    bids: { [price: string]: quantity },
    asks: { [price: string]: quantity },
    eventTime?: number
}
```

## Data Structures

### Depth Cache Object

```javascript
{
    symbol: "BTCUSDT",
    bids: {
        "45000.00": 1.5,    // price: quantity
        "44999.99": 0.8,
        "44999.98": 2.1
    },
    asks: {
        "45000.01": 0.9,
        "45000.02": 1.2,
        "45000.03": 0.5
    },
    eventTime: 1640995200000
}
```

### Callback Parameters

```javascript
function depthCallback(symbol, depth, context) {
    // symbol: string - Trading pair symbol
    // depth: object - Current depth cache state
    // context: object - Additional context information
}
```

## Advanced Features

### Staggered Subscriptions

Use staggered subscriptions when subscribing to many symbols to avoid rate limiting:

```javascript
const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'];

binance.websockets.depthCacheStaggered(symbols, (symbol, depth) => {
    console.log(`Updated: ${symbol}`);
}, 100, 300); // 300ms between each subscription
```

### Cumulative Volume Analysis

```javascript
binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    // Get cumulative volumes
    const bids = binance.sortBids(symbol, 10, 'cumulative');
    const asks = binance.sortAsks(symbol, 10, 'cumulative');
    
    console.log('Cumulative bid volume at each level:', bids);
});
```

### Market Depth Analysis

```javascript
binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const volume = binance.depthVolume(symbol);
    const spread = parseFloat(binance.first(binance.sortAsks(symbol))) - 
                   parseFloat(binance.first(binance.sortBids(symbol)));
    
    console.log({
        symbol,
        spread: spread.toFixed(2),
        bidVolume: volume.bids,
        askVolume: volume.asks,
        ratio: (volume.bids / volume.asks).toFixed(3)
    });
});
```

## Best Practices

### 1. Connection Management

```javascript
// Store subscription references for cleanup
const subscriptions = {};

subscriptions.btcusdt = binance.websockets.depthCache('BTCUSDT', callback);

// Cleanup when done
binance.websockets.terminate(subscriptions.btcusdt);
```

### 2. Error Handling

```javascript
const binance = new Binance({
    APIKEY: 'your-key',
    APISECRET: 'your-secret',
    reconnect: true,  // Auto-reconnect on disconnect
    verbose: true     // Enable debug logging
});

binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    try {
        // Process depth data
        processDepthData(symbol, depth);
    } catch (error) {
        console.error('Error processing depth data:', error);
    }
});
```

### 3. Rate Limiting

```javascript
// Throttle updates for high-frequency processing
let lastUpdate = 0;
const throttleMs = 100; // Limit to once per 100ms

binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const now = Date.now();
    if (now - lastUpdate < throttleMs) return;
    
    lastUpdate = now;
    processUpdate(symbol, depth);
});
```

### 4. Memory Management

```javascript
// Clear cache periodically to free memory
setInterval(() => {
    const symbols = Object.keys(binance.depthCache);
    symbols.forEach(symbol => {
        if (shouldClearCache(symbol)) {
            binance.websockets.clearDepthCache(symbol);
        }
    });
}, 300000); // Every 5 minutes
```

## Error Handling

### Common Error Scenarios

1. **Network Disconnection**: Use `reconnect: true` option
2. **API Rate Limits**: Implement staggered subscriptions
3. **Invalid Symbols**: Validate symbols before subscribing
4. **Memory Leaks**: Clear unused caches periodically

### Error Recovery

```javascript
const binance = new Binance({
    reconnect: true,
    verbose: true,
    log: (message) => {
        if (message.includes('error')) {
            console.error('WebSocket error:', message);
        }
    }
});

// Implement custom reconnection logic
function setupDepthCache(symbol) {
    const subscription = binance.websockets.depthCache(symbol, 
        (symbol, depth) => {
            // Handle updates
        },
        500
    );
    
    // Store subscription for cleanup
    return subscription;
}
```

## Examples

### Basic Order Book Display

```javascript
function displayOrderBook(symbol, depth) {
    const bids = binance.sortBids(depth.bids, 5);
    const asks = binance.sortAsks(depth.asks, 5);
    
    console.clear();
    console.log(`\n=== ${symbol} Order Book ===`);
    console.log('ASKS (Sell Orders)');
    Object.entries(asks).reverse().forEach(([price, qty]) => {
        console.log(`${price.padStart(12)} | ${qty.toString().padStart(10)}`);
    });
    console.log('---'.repeat(8));
    Object.entries(bids).forEach(([price, qty]) => {
        console.log(`${price.padStart(12)} | ${qty.toString().padStart(10)}`);
    });
    console.log('BIDS (Buy Orders)');
}

binance.websockets.depthCache('BTCUSDT', displayOrderBook);
```

### Multiple Symbol Monitor

```javascript
const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
const stats = {};

function updateStats(symbol, depth) {
    const bids = binance.sortBids(depth.bids, 1);
    const asks = binance.sortAsks(depth.asks, 1);
    const spread = parseFloat(binance.first(asks)) - parseFloat(binance.first(bids));
    
    stats[symbol] = {
        bestBid: binance.first(bids),
        bestAsk: binance.first(asks),
        spread: spread.toFixed(2),
        lastUpdate: new Date()
    };
    
    // Display updated stats
    console.table(stats);
}

symbols.forEach(symbol => {
    binance.websockets.depthCache(symbol, updateStats);
});
```

### Arbitrage Monitor

```javascript
const exchanges = {
    binance: new Binance(config)
};

function checkArbitrage(symbol, depth) {
    const bestBid = parseFloat(binance.first(binance.sortBids(depth.bids)));
    const bestAsk = parseFloat(binance.first(binance.sortAsks(depth.asks)));
    
    // Check for arbitrage opportunities
    const spreadPercent = ((bestAsk - bestBid) / bestBid * 100);
    
    if (spreadPercent > 0.5) { // 0.5% spread threshold
        console.log(`Arbitrage opportunity found for ${symbol}:`);
        console.log(`Buy at: ${bestBid}, Sell at: ${bestAsk}`);
        console.log(`Potential profit: ${spreadPercent.toFixed(3)}%`);
    }
}

binance.websockets.depthCache(['BTCUSDT', 'ETHUSDT'], checkArbitrage);
```

### Real-time Volume Tracking

```javascript
const volumeTracker = {};

function trackVolume(symbol, depth) {
    const volume = binance.depthVolume(symbol);
    
    if (!volumeTracker[symbol]) {
        volumeTracker[symbol] = { history: [], maxSize: 100 };
    }
    
    const tracker = volumeTracker[symbol];
    tracker.history.push({
        timestamp: Date.now(),
        bidVolume: volume.bids,
        askVolume: volume.asks,
        ratio: volume.bids / volume.asks
    });
    
    // Keep only recent history
    if (tracker.history.length > tracker.maxSize) {
        tracker.history.shift();
    }
    
    // Calculate volume trends
    const recent = tracker.history.slice(-10);
    const avgRatio = recent.reduce((sum, item) => sum + item.ratio, 0) / recent.length;
    
    if (avgRatio > 1.5) {
        console.log(`${symbol}: Strong buying pressure detected (ratio: ${avgRatio.toFixed(2)})`);
    } else if (avgRatio < 0.66) {
        console.log(`${symbol}: Strong selling pressure detected (ratio: ${avgRatio.toFixed(2)})`);
    }
}

binance.websockets.depthCache(['BTCUSDT', 'ETHUSDT'], trackVolume);
```

## Configuration Options

### Initialization Options

```javascript
const binance = new Binance({
    // Connection settings
    reconnect: true,          // Auto-reconnect on disconnect
    keepAlive: true,         // Keep connections alive
    verbose: false,          // Debug logging
    
    // Custom endpoints (optional)
    urls: {
        stream: 'wss://stream.binance.com:9443/ws/',
        combineStream: 'wss://stream.binance.com:9443/stream?streams='
    },
    
    // Proxy settings (optional)
    httpsProxy: 'http://proxy:8080',
    socksProxy: 'socks5://proxy:1080',
    
    // Custom logging
    log: (message) => console.log(`[Binance]: ${message}`)
});
```

### Performance Optimization

```javascript
// Optimize for high-frequency updates
const binance = new Binance({
    reconnect: true,
    family: 4,              // Use IPv4
    localAddress: false,    // No specific local address
    keepAlive: true,        // Maintain connections
    verbose: false          // Disable debug logging for performance
});

// Use smaller depth limits for faster processing
binance.websockets.depthCache(symbols, callback, 100); // Instead of 500
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```javascript
   // Increase timeout settings
   const binance = new Binance({
       timeout: 30000,  // 30 second timeout
       reconnect: true
   });
   ```

2. **Memory Usage**
   ```javascript
   // Monitor memory usage
   setInterval(() => {
       const memUsage = process.memoryUsage();
       console.log('Memory:', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
   }, 60000);
   ```

3. **Rate Limiting**
   ```javascript
   // Implement exponential backoff
   let retryCount = 0;
   const maxRetries = 5;
   
   function connectWithBackoff(symbol) {
       try {
           return binance.websockets.depthCache(symbol, callback);
       } catch (error) {
           if (retryCount < maxRetries) {
               const delay = Math.pow(2, retryCount) * 1000;
               setTimeout(() => connectWithBackoff(symbol), delay);
               retryCount++;
           }
       }
   }
   ```

## Conclusion

The DepthCache functionality provides powerful real-time order book data streaming capabilities. By following the patterns and best practices outlined in this documentation, you can build robust trading applications that efficiently process market depth data.

For additional support, refer to the main project documentation or check the examples directory for more implementation patterns.
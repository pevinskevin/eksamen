# WebSocket DepthCache Documentation

<small>

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
    APISECRET: 'your-api-secret',
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

-   `symbols` (string | string[]): Single symbol or array of symbols
-   `callback` (function): Callback function called on each update
-   `limit` (number, optional): Number of price levels to retrieve (default: 500)

**Returns:** WebSocket endpoint URL

#### `depthCacheStaggered(symbols, callback, limit, stagger)`

Creates staggered depth cache subscriptions to avoid rate limiting.

**Parameters:**

-   `symbols` (string[]): Array of symbols to subscribe to
-   `callback` (function): Callback function for updates
-   `limit` (number, optional): Number of price levels (default: 100)
-   `stagger` (number, optional): Milliseconds between subscriptions (default: 200)

**Returns:** Promise that resolves when all subscriptions are established

#### `clearDepthCache(symbols)`

Clears the depth cache for specified symbols.

**Parameters:**

-   `symbols` (string | string[]): Symbol(s) to clear from cache

### Utility Methods

#### `sortBids(symbol, max, baseValue)`

Returns sorted bid orders (highest price first).

**Parameters:**

-   `symbol` (string | object): Symbol name or bid object
-   `max` (number, optional): Maximum number of orders (default: Infinity)
-   `baseValue` (string, optional): 'cumulative' or undefined

#### `sortAsks(symbol, max, baseValue)`

Returns sorted ask orders (lowest price first).

**Parameters:**

-   `symbol` (string | object): Symbol name or ask object
-   `max` (number, optional): Maximum number of orders (default: Infinity)
-   `baseValue` (string, optional): 'cumulative' or undefined

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

binance.websockets.depthCacheStaggered(
    symbols,
    (symbol, depth) => {
        console.log(`Updated: ${symbol}`);
    },
    100,
    300
); // 300ms between each subscription
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
    const spread =
        parseFloat(binance.first(binance.sortAsks(symbol))) -
        parseFloat(binance.first(binance.sortBids(symbol)));

    console.log({
        symbol,
        spread: spread.toFixed(2),
        bidVolume: volume.bids,
        askVolume: volume.asks,
        ratio: (volume.bids / volume.asks).toFixed(3),
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
    reconnect: true, // Auto-reconnect on disconnect
    verbose: true, // Enable debug logging
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
    symbols.forEach((symbol) => {
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
    },
});

// Implement custom reconnection logic
function setupDepthCache(symbol) {
    const subscription = binance.websockets.depthCache(
        symbol,
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
    Object.entries(asks)
        .reverse()
        .forEach(([price, qty]) => {
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
        lastUpdate: new Date(),
    };

    // Display updated stats
    console.table(stats);
}

symbols.forEach((symbol) => {
    binance.websockets.depthCache(symbol, updateStats);
});
```

### Arbitrage Monitor

```javascript
const exchanges = {
    binance: new Binance(config),
};

function checkArbitrage(symbol, depth) {
    const bestBid = parseFloat(binance.first(binance.sortBids(depth.bids)));
    const bestAsk = parseFloat(binance.first(binance.sortAsks(depth.asks)));

    // Check for arbitrage opportunities
    const spreadPercent = ((bestAsk - bestBid) / bestBid) * 100;

    if (spreadPercent > 0.5) {
        // 0.5% spread threshold
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
        ratio: volume.bids / volume.asks,
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
    reconnect: true, // Auto-reconnect on disconnect
    keepAlive: true, // Keep connections alive
    verbose: false, // Debug logging

    // Custom endpoints (optional)
    urls: {
        stream: 'wss://stream.binance.com:9443/ws/',
        combineStream: 'wss://stream.binance.com:9443/stream?streams=',
    },

    // Proxy settings (optional)
    httpsProxy: 'http://proxy:8080',
    socksProxy: 'socks5://proxy:1080',

    // Custom logging
    log: (message) => console.log(`[Binance]: ${message}`),
});
```

### Performance Optimization

```javascript
// Optimize for high-frequency updates
const binance = new Binance({
    reconnect: true,
    family: 4, // Use IPv4
    localAddress: false, // No specific local address
    keepAlive: true, // Maintain connections
    verbose: false, // Disable debug logging for performance
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
        timeout: 30000, // 30 second timeout
        reconnect: true,
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

---

## Advanced Documentation (Generated Content)

### Overview

The DepthCache functionality in node-binance-api provides a high-performance, real-time synchronized local order book that automatically maintains consistency with Binance's live order book data. It combines REST API snapshots with WebSocket differential updates to create a reliable, always-current view of market depth.

This implementation follows Binance's official guidelines for maintaining a local order book, ensuring data integrity through proper synchronization and error handling.

### How the DepthCache Works

The DepthCache system operates through a sophisticated synchronization mechanism:

#### 1. Initial Connection Phase

When you subscribe to a depth cache, the library:

-   Establishes a WebSocket connection to Binance's depth stream (@depth@100ms)
-   Initializes internal data structures for tracking synchronization state
-   Begins queuing incoming WebSocket messages

#### 2. Snapshot Retrieval

-   Fetches a REST API snapshot of the current order book state
-   The snapshot includes a lastUpdateId that serves as a synchronization point
-   Default limit is 500 levels (configurable)

#### 3. Message Queue Processing

-   All WebSocket messages received before the snapshot are queued
-   After snapshot arrival, queued messages are filtered:
    -   Messages with u (final update ID) <= snapshot's lastUpdateId are discarded
    -   Valid messages are processed in order

#### 4. Real-time Synchronization

-   Each WebSocket update contains:

    -   **U**: First update ID in event
    -   **u**: Final update ID in event
    -   **b**: Bid updates
    -   **a**: Ask updates

-   The library validates each update's sequence:
    -   Expected U should be lastEventUpdateId + 1
    -   If not, the cache is out of sync and an error is thrown

#### 5. Update Processing

-   For each price level update:
    -   If quantity is 0, the level is removed
    -   Otherwise, the level is updated with the new quantity
-   The cache maintains sorted order for efficient access

### Enhanced API Reference

#### Main Methods (Detailed)

##### `depthCache(symbols, callback, limit)`

The cache maintains sorted order for efficient access

Basic Usage
Single Symbol DepthCache
javascriptconst Binance = require('node-binance-api');
const binance = new Binance({
APIKEY: 'your-api-key',
APISECRET: 'your-api-secret'
});

// Subscribe to BTCUSDT depth cache
binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
// Get sorted bids and asks
const bids = binance.sortBids(depth.bids);
const asks = binance.sortAsks(depth.asks);

    console.log(`${symbol} Order Book Update`);
    console.log('Best bid:', binance.first(bids));
    console.log('Best ask:', binance.first(asks));
    console.log('Spread:', (parseFloat(binance.first(asks)) - parseFloat(binance.first(bids))).toFixed(2));
    console.log('Update time:', new Date(depth.eventTime));

});
Multiple Symbols DepthCache
javascript// Subscribe to multiple symbols efficiently
const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

binance.websockets.depthCache(symbols, (symbol, depth) => {
console.log(`${symbol} best bid/ask:`, {
bid: binance.first(binance.sortBids(depth.bids)),
ask: binance.first(binance.sortAsks(depth.asks))
});
});
API Reference
Main Methods
depthCache(symbols, callback, limit)
Subscribes to real-time order book data for specified symbols.

**Parameters:**

-   `symbols` (string | string[]): Single symbol or array of symbols to subscribe
-   `callback` (function): Function called on each depth update
    -   `symbol` (string): The symbol that was updated
    -   `depth` (object): The current depth cache state
    -   `context` (object): Additional context information (optional)
-   `limit` (number, optional): Number of price levels to maintain (default: 500)
    -   Valid values: 5, 10, 20, 50, 100, 500, 1000

**Returns:** String - WebSocket endpoint URL

**Example:**

```javascript
const endpoint = binance.websockets.depthCache(
    ['BTCUSDT', 'ETHUSDT'],
    (symbol, depth) => {
        console.log(`${symbol} has ${Object.keys(depth.bids).length} bid levels`);
    },
    100 // Maintain top 100 levels
);
console.log('Connected to:', endpoint);
```

##### `depthCacheStaggered(symbols, callback, limit, stagger)`

Creates staggered depth cache subscriptions to avoid rate limiting when subscribing to many symbols.

**Parameters:**

-   `symbols` (string[]): Array of symbols to subscribe to
-   `callback` (function): Callback function for updates
-   `limit` (number, optional): Number of price levels (default: 100)
-   `stagger` (number, optional): Milliseconds between subscriptions (default: 200)

**Returns:** Promise - Resolves when all subscriptions are established

**Example:**

```javascript
// Subscribe to 50 symbols with 300ms delay between each
const manySymbols = ['BTCUSDT', 'ETHUSDT' /* ... 48 more ... */];

binance.websockets
    .depthCacheStaggered(
        manySymbols,
        (symbol, depth) => {
            // Process each symbol's updates
        },
        100, // depth limit
        300 // 300ms between subscriptions
    )
    .then(() => {
        console.log('All depth caches initialized');
    });
```

##### `clearDepthCache(symbols)`

Clears the depth cache for specified symbols, freeing memory.

**Parameters:**

-   `symbols` (string | string[]): Symbol(s) to clear from cache

**Example:**

```javascript
// Clear single symbol
binance.websockets.clearDepthCache('BTCUSDT');

// Clear multiple symbols
binance.websockets.clearDepthCache(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']);
```

#### Enhanced Utility Methods

##### `sortBids(bidsObject, max, baseValue)`

Returns sorted bid orders with highest price first.

**Parameters:**

-   `bidsObject` (string | object): Symbol name or bid object from depth cache
-   `max` (number, optional): Maximum number of orders to return (default: Infinity)
-   `baseValue` (string, optional): Transform mode
    -   `undefined`: Return price → quantity mapping (default)
    -   `'cumulative'`: Return cumulative quantities
    -   `'value'`: Return price → value (price × quantity) mapping

**Returns:** Object - Sorted bids

**Example:**

```javascript
// Get top 10 bids
const top10Bids = binance.sortBids('BTCUSDT', 10);

// Get cumulative bid depth
const cumulativeBids = binance.sortBids('BTCUSDT', 20, 'cumulative');

// Get bid values (price × quantity)
const bidValues = binance.sortBids('BTCUSDT', 10, 'value');
```

##### `sortAsks(asksObject, max, baseValue)`

Returns sorted ask orders with lowest price first.

**Parameters:** Same as sortBids

**Returns:** Object - Sorted asks

##### `getDepthCache(symbol)`

Retrieves the current depth cache for a symbol.

**Parameters:**

-   `symbol` (string): The trading pair symbol

**Returns:** Object - Current depth cache state

```javascript
{
    bids: { '45000.00': 1.5, '44999.99': 0.8, ... },
    asks: { '45000.01': 0.9, '45000.02': 1.2, ... },
    eventTime: 1640995200000
}
```

##### `depthVolume(symbol)`

Calculates total bid/ask volume and quantities from the depth cache.

**Parameters:**

-   `symbol` (string): The trading pair symbol

**Returns:** Object - Volume statistics

```javascript
{
    bids: 4521.35,      // Total bid volume in base currency
    asks: 3892.18,      // Total ask volume in base currency
    bidQty: 95.234,     // Total bid quantity
    askQty: 82.445      // Total ask quantity
}
```

### Enhanced Data Structures

#### Depth Cache Object

The depth cache maintains the following structure for each symbol:

```javascript
{
    bids: {
        '45000.00': 1.5,      // price: quantity
        '44999.99': 0.8,
        '44999.98': 2.1,
        // ... more bid levels
    },
    asks: {
        '45000.01': 0.9,      // price: quantity
        '45000.02': 1.2,
        '45000.03': 0.5,
        // ... more ask levels
    },
    eventTime: 1640995200000  // Last update timestamp
}
```

#### Callback Parameters

The depth cache callback receives three parameters:

```javascript
function depthCallback(symbol, depth, context) {
    // symbol: string - The trading pair (e.g., 'BTCUSDT')
    // depth: object - Current depth cache state
    // context: object - Synchronization context (optional)
}
```

#### Context Object

The context object (third callback parameter) provides synchronization details:

```javascript
{
    snapshotUpdateId: 123456789,     // Update ID from initial snapshot
    lastEventUpdateId: 123456790,    // Last processed update ID
    lastEventUpdateTime: 1640995200000,  // Last update timestamp
    skipCount: 0,                    // Number of skipped updates
    endpointId: 'btcusdt@depth@100ms'  // WebSocket endpoint
}
```

### Advanced Features

#### Real-time Spread Monitoring

```javascript
const spreadAlerts = {};

binance.websockets.depthCache(['BTCUSDT', 'ETHUSDT'], (symbol, depth) => {
    const bestBid = parseFloat(binance.first(binance.sortBids(depth.bids)));
    const bestAsk = parseFloat(binance.first(binance.sortAsks(depth.asks)));
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestBid) * 100;

    // Alert on significant spread changes
    if (!spreadAlerts[symbol]) spreadAlerts[symbol] = spreadPercent;

    if (Math.abs(spreadPercent - spreadAlerts[symbol]) > 0.1) {
        console.log(`${symbol} Spread Alert: ${spreadPercent.toFixed(3)}%`);
        spreadAlerts[symbol] = spreadPercent;
    }
});
```

#### Order Book Imbalance Detection

```javascript
binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const volume = binance.depthVolume(symbol);
    const imbalance = (volume.bids - volume.asks) / (volume.bids + volume.asks);

    if (Math.abs(imbalance) > 0.3) {
        console.log(`${symbol} Order Book Imbalance: ${(imbalance * 100).toFixed(2)}%`);
        console.log(`Bid Volume: ${volume.bids.toFixed(2)}`);
        console.log(`Ask Volume: ${volume.asks.toFixed(2)}`);
    }
});
```

#### Volume-Weighted Average Price (VWAP) Calculation

```javascript
function calculateVWAP(orders, targetVolume) {
    let totalVolume = 0;
    let totalValue = 0;

    for (const [price, quantity] of Object.entries(orders)) {
        const priceFloat = parseFloat(price);
        const quantityFloat = parseFloat(quantity);

        if (totalVolume + quantityFloat <= targetVolume) {
            totalVolume += quantityFloat;
            totalValue += priceFloat * quantityFloat;
        } else {
            const remainingVolume = targetVolume - totalVolume;
            totalVolume += remainingVolume;
            totalValue += priceFloat * remainingVolume;
            break;
        }
    }

    return totalVolume > 0 ? totalValue / totalVolume : 0;
}

binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const targetVolume = 10; // 10 BTC

    const bidVWAP = calculateVWAP(binance.sortBids(depth.bids), targetVolume);
    const askVWAP = calculateVWAP(binance.sortAsks(depth.asks), targetVolume);

    console.log(`${symbol} VWAP for ${targetVolume} BTC:`);
    console.log(`Bid VWAP: $${bidVWAP.toFixed(2)}`);
    console.log(`Ask VWAP: $${askVWAP.toFixed(2)}`);
});
```

#### Liquidity Analysis

```javascript
function analyzeLiquidity(symbol, depth, priceRange = 0.001) {
    const bids = binance.sortBids(depth.bids);
    const asks = binance.sortAsks(depth.asks);

    const midPrice = (parseFloat(binance.first(bids)) + parseFloat(binance.first(asks))) / 2;
    const lowerBound = midPrice * (1 - priceRange);
    const upperBound = midPrice * (1 + priceRange);

    let bidLiquidity = 0;
    let askLiquidity = 0;

    // Calculate bid liquidity within range
    for (const [price, qty] of Object.entries(bids)) {
        if (parseFloat(price) >= lowerBound) {
            bidLiquidity += parseFloat(price) * parseFloat(qty);
        }
    }

    // Calculate ask liquidity within range
    for (const [price, qty] of Object.entries(asks)) {
        if (parseFloat(price) <= upperBound) {
            askLiquidity += parseFloat(price) * parseFloat(qty);
        }
    }

    return {
        bidLiquidity,
        askLiquidity,
        totalLiquidity: bidLiquidity + askLiquidity,
        ratio: bidLiquidity / askLiquidity,
    };
}
```

### Enhanced Error Handling

#### Synchronization Errors

The depth cache will throw errors when synchronization issues are detected:

```javascript
binance.websockets.depthCache(
    'BTCUSDT',
    (symbol, depth) => {
        try {
            // Your depth processing logic
        } catch (error) {
            console.error(`Error processing ${symbol}:`, error);
        }
    },
    500
);

// Global error handling
process.on('unhandledRejection', (error) => {
    if (error.message.includes('depth cache is out of sync')) {
        console.error('Depth cache synchronization error:', error);
        // The WebSocket will automatically reconnect if reconnect is enabled
    }
});
```

#### Common Error Scenarios

1. **Gap Between Snapshot and Stream Data**

    - Error: "The depth cache is out of sync. Symptom: Gap between snapshot and first stream data."
    - Cause: Missing updates between snapshot and first WebSocket message
    - Solution: Automatic reconnection will resolve this

2. **Unexpected Update ID**

    - Error: "The depth cache is out of sync. Symptom: Unexpected Update ID."
    - Cause: Received update ID doesn't match expected sequence
    - Solution: Cache will be rebuilt automatically on reconnection

3. **Network Disconnections**
    ```javascript
    const binance = new Binance({
        APIKEY: 'your-key',
        APISECRET: 'your-secret',
        reconnect: true, // Enable automatic reconnection
        verbose: true, // Enable debug logging
    });
    ```

#### Manual Error Recovery

```javascript
let depthSubscription;

function connectDepthCache() {
    try {
        depthSubscription = binance.websockets.depthCache(
            'BTCUSDT',
            (symbol, depth) => {
                // Process depth updates
            },
            500
        );
    } catch (error) {
        console.error('Failed to connect depth cache:', error);
        // Retry after delay
        setTimeout(connectDepthCache, 5000);
    }
}

// Start connection
connectDepthCache();

// Clean shutdown
process.on('SIGINT', () => {
    if (depthSubscription) {
        binance.websockets.terminate(depthSubscription);
    }
    process.exit();
});
```

### Enhanced Best Practices

#### 1. Connection Management

```javascript
// Store references for cleanup
const subscriptions = {};

// Subscribe with reference tracking
subscriptions.btcusdt = binance.websockets.depthCache('BTCUSDT', callback);

// Cleanup on shutdown
process.on('beforeExit', () => {
    Object.values(subscriptions).forEach((endpoint) => {
        binance.websockets.terminate(endpoint);
    });
});
```

#### 2. Throttling High-Frequency Updates

```javascript
const throttle = (func, delay) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func(...args);
        }
    };
};

// Throttle updates to once per 100ms
const throttledHandler = throttle((symbol, depth) => {
    // Process depth update
    updateUI(symbol, depth);
}, 100);

binance.websockets.depthCache('BTCUSDT', throttledHandler);
```

#### 3. Memory Management

```javascript
// Monitor memory usage
const monitorMemory = () => {
    const used = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`- Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    console.log(`- External: ${Math.round(used.external / 1024 / 1024)}MB`);
};

// Periodic memory monitoring
setInterval(monitorMemory, 60000);

// Clear unused caches
const inactiveSymbols = ['BTCUSDT', 'ETHUSDT'];
binance.websockets.clearDepthCache(inactiveSymbols);
```

#### 4. Choosing Appropriate Depth Limits

-   **5-20 levels**: Sufficient for spread analysis and basic market making
-   **50-100 levels**: Good for liquidity analysis and VWAP calculations
-   **500-1000 levels**: Needed for deep liquidity analysis or large order impact estimation

```javascript
// Adjust depth based on use case
const config = {
    scalping: { limit: 20 }, // Fast updates, minimal data
    marketMaking: { limit: 100 }, // Balance of depth and performance
    analysis: { limit: 500 }, // Complete market picture
};

binance.websockets.depthCache('BTCUSDT', callback, config.marketMaking.limit);
```

### Performance Optimization

#### 1. Batch Processing

```javascript
const updates = [];
let processingScheduled = false;

function scheduleProcessing() {
    if (!processingScheduled) {
        processingScheduled = true;
        setImmediate(() => {
            processBatch();
            processingScheduled = false;
        });
    }
}

function processBatch() {
    if (updates.length === 0) return;

    // Process all updates at once
    const batch = updates.splice(0, updates.length);
    console.log(`Processing ${batch.length} updates`);

    // Your batch processing logic here
}

binance.websockets.depthCache(['BTCUSDT', 'ETHUSDT'], (symbol, depth) => {
    updates.push({ symbol, depth, timestamp: Date.now() });
    scheduleProcessing();
});
```

#### 2. Efficient Data Access

```javascript
// Cache frequently accessed values
const depthMetrics = {};

binance.websockets.depthCache('BTCUSDT', (symbol, depth) => {
    const bids = binance.sortBids(depth.bids, 1);
    const asks = binance.sortAsks(depth.asks, 1);

    // Cache computed values
    depthMetrics[symbol] = {
        bestBid: binance.first(bids),
        bestAsk: binance.first(asks),
        spread: parseFloat(binance.first(asks)) - parseFloat(binance.first(bids)),
        updateTime: depth.eventTime,
    };
});

// Access cached values without recomputation
setInterval(() => {
    console.log('Current metrics:', depthMetrics);
}, 1000);
```

#### 3. Selective Updates

```javascript
// Only process significant changes
const thresholds = {
    BTCUSDT: { price: 0.01, volume: 0.1 },
    ETHUSDT: { price: 0.01, volume: 1.0 },
};

const lastUpdate = {};

binance.websockets.depthCache(['BTCUSDT', 'ETHUSDT'], (symbol, depth) => {
    const current = {
        bid: parseFloat(binance.first(binance.sortBids(depth.bids))),
        ask: parseFloat(binance.first(binance.sortAsks(depth.asks))),
    };

    if (!lastUpdate[symbol]) {
        lastUpdate[symbol] = current;
        return;
    }

    const threshold = thresholds[symbol];
    const bidChange = Math.abs(current.bid - lastUpdate[symbol].bid);
    const askChange = Math.abs(current.ask - lastUpdate[symbol].ask);

    // Only process if change exceeds threshold
    if (bidChange > threshold.price || askChange > threshold.price) {
        console.log(`${symbol} significant change detected`);
        lastUpdate[symbol] = current;
        // Process the update
    }
});
```

### Troubleshooting

#### Common Issues and Solutions

1. **"Parse error" Messages**

    - Cause: Invalid JSON or connection issues
    - Solution: Enable verbose logging to debug

    ```javascript
    binance.setOption('verbose', true);
    ```

2. **Missing Updates**

    - Cause: Network latency or packet loss
    - Solution: Use reconnect option and monitor connection health

    ```javascript
    const binance = new Binance({
        reconnect: true,
        keepAlive: true,
    });
    ```

3. **High Memory Usage**

    - Cause: Subscribing to many symbols with deep order books
    - Solution:
        - Use smaller depth limits
        - Clear unused caches periodically
        - Implement pagination for multiple symbols

4. **Slow Performance**
    - Cause: Heavy computation in callback
    - Solution:
        - Move computation to separate thread/process
        - Use throttling/debouncing
        - Optimize data structures

#### Debug Logging

```javascript
// Enable detailed logging
binance.setOption('log', (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
});

// Monitor WebSocket health
setInterval(() => {
    const subs = binance.websockets.subscriptions();
    console.log('Active WebSocket connections:', Object.keys(subs).length);
}, 30000);
```

### Complete Examples

#### Market Maker Helper

```javascript
class MarketMakerHelper {
    constructor(binance, symbol, options = {}) {
        this.binance = binance;
        this.symbol = symbol;
        this.options = {
            spreadThreshold: 0.001, // 0.1%
            depthLimit: 100,
            updateInterval: 100, // ms
            ...options,
        };

        this.metrics = {
            spread: 0,
            midPrice: 0,
            imbalance: 0,
            lastUpdate: 0,
        };

        this.initDepthCache();
    }

    initDepthCache() {
        this.binance.websockets.depthCache(
            this.symbol,
            this.handleDepthUpdate.bind(this),
            this.options.depthLimit
        );
    }

    handleDepthUpdate(symbol, depth) {
        const now = Date.now();
        if (now - this.metrics.lastUpdate < this.options.updateInterval) {
            return; // Throttle updates
        }

        this.metrics.lastUpdate = now;
        this.updateMetrics(depth);
        this.checkTradingConditions();
    }

    updateMetrics(depth) {
        const bids = this.binance.sortBids(depth.bids, 1);
        const asks = this.binance.sortAsks(depth.asks, 1);

        const bestBid = parseFloat(this.binance.first(bids));
        const bestAsk = parseFloat(this.binance.first(asks));

        this.metrics.spread = (bestAsk - bestBid) / bestBid;
        this.metrics.midPrice = (bestBid + bestAsk) / 2;

        // Calculate order book imbalance
        const volume = this.binance.depthVolume(this.symbol);
        this.metrics.imbalance = (volume.bids - volume.asks) / (volume.bids + volume.asks);
    }

    checkTradingConditions() {
        // Example condition: wide spread opportunity
        if (this.metrics.spread > this.options.spreadThreshold) {
            console.log(`${this.symbol} Trading Opportunity:`);
            console.log(`- Spread: ${(this.metrics.spread * 100).toFixed(3)}%`);
            console.log(`- Mid Price: ${this.metrics.midPrice.toFixed(2)}`);
            console.log(`- Imbalance: ${(this.metrics.imbalance * 100).toFixed(2)}%`);
        }
    }

    getMetrics() {
        return this.metrics;
    }

    shutdown() {
        // Clean up resources
        this.binance.websockets.clearDepthCache(this.symbol);
    }
}

// Usage
const binance = new Binance({
    /* config */
});
const btcMM = new MarketMakerHelper(binance, 'BTCUSDT', {
    spreadThreshold: 0.0005, // 0.05%
    depthLimit: 50,
});

// Access metrics
setInterval(() => {
    console.log('BTC Metrics:', btcMM.getMetrics());
}, 5000);
```

#### Multi-Symbol Dashboard

```javascript
class DepthDashboard {
    constructor(binance, symbols) {
        this.binance = binance;
        this.symbols = symbols;
        this.data = {};
        this.initializeDepthCaches();
    }

    initializeDepthCaches() {
        // Use staggered connection to avoid rate limits
        this.binance.websockets
            .depthCacheStaggered(
                this.symbols,
                this.updateHandler.bind(this),
                20, // Top 20 levels
                300 // 300ms between connections
            )
            .then(() => {
                console.log('All depth caches initialized');
                this.startDashboard();
            });
    }

    updateHandler(symbol, depth) {
        const bids = this.binance.sortBids(depth.bids, 1);
        const asks = this.binance.sortAsks(depth.asks, 1);

        this.data[symbol] = {
            bid: parseFloat(this.binance.first(bids)),
            ask: parseFloat(this.binance.first(asks)),
            spread: parseFloat(this.binance.first(asks)) - parseFloat(this.binance.first(bids)),
            volume: this.binance.depthVolume(symbol),
            updateTime: depth.eventTime,
        };
    }

    startDashboard() {
        setInterval(() => {
            console.clear();
            console.log('=== Depth Dashboard ===');
            console.log(new Date().toLocaleString());
            console.log('');

            // Sort by volume
            const sorted = Object.entries(this.data).sort(
                (a, b) => b[1].volume.bids - a[1].volume.bids
            );

            sorted.forEach(([symbol, data]) => {
                console.log(`${symbol}:`);
                console.log(`  Bid: ${data.bid.toFixed(2)} | Ask: ${data.ask.toFixed(2)}`);
                console.log(
                    `  Spread: ${data.spread.toFixed(2)} (${(
                        (data.spread / data.bid) *
                        100
                    ).toFixed(3)}%)`
                );
                console.log(
                    `  Volume: ${data.volume.bids.toFixed(2)} / ${data.volume.asks.toFixed(2)}`
                );
                console.log('');
            });
        }, 2000);
    }
}

// Create dashboard for top pairs
const dashboard = new DepthDashboard(binance, [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'ADAUSDT',
]);
```

### Final Notes

The WebSocket DepthCache functionality provides a robust foundation for building real-time trading applications. By maintaining a synchronized local order book, you can implement sophisticated trading strategies with minimal latency and maximum reliability. Remember to always handle errors appropriately, manage resources efficiently, and follow best practices for optimal performance.

</small>

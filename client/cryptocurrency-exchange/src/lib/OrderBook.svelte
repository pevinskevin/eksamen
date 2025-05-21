<script>
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';

  let asks = [];
  let bids = [];
  let socket;

  onMount(() => {
    console.log("OrderBook component mounted, connecting to WebSocket server http://localhost:8080...");
    socket = io('http://localhost:8080');

    socket.on('connect', () => {
      console.log('Successfully connected to WebSocket server. Socket ID:', socket.id);
    });

    socket.on('orderBookUpdate', (eventData) => {
      // console.log('Received orderBookUpdate raw data:', eventData); // Keep this commented unless debugging

      if (eventData && eventData.asks) {
        asks = Object.entries(eventData.asks)
          .map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) }))
          .sort((a, b) => a.price - b.price);
        // console.log('Transformed asks:', asks);
      } else {
        // console.log('No asks data in event or eventData is null/undefined');
      }

      if (eventData && eventData.bids) {
        bids = Object.entries(eventData.bids)
          .map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) }))
          .sort((a, b) => b.price - a.price);
        // console.log('Transformed bids:', bids);
      } else {
        // console.log('No bids data in event or eventData is null/undefined');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      console.log("OrderBook component unmounting, disconnecting socket...");
      if (socket) {
        socket.disconnect();
      }
    };
  });

</script>

<main class="order-book-main-container">
  <h1>Order Book</h1>

  <div class="order-book-layout">
    <section class="asks-section">
      <h2>Asks</h2>
      {#if asks.length === 0}
        <p class="loading-message">Loading asks...</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Price (USD)</th>
              <th>Quantity</th>
              <th>Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {#each asks as item (item.price)}
              <tr class="ask-row">
                <td class="price-cell">{item.price.toFixed(2)}</td>
                <td>{item.quantity.toFixed(4)}</td>
                <td>{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>

    <section class="bids-section">
      <h2>Bids</h2>
      {#if bids.length === 0}
        <p class="loading-message">Loading bids...</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Price (USD)</th>
              <th>Quantity</th>
              <th>Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {#each bids as item (item.price)}
              <tr class="bid-row">
                <td class="price-cell">{item.price.toFixed(2)}</td>
                <td>{item.quantity.toFixed(4)}</td>
                <td>{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  </div>
</main>

<style>
  .order-book-main-container {
    font-family: 'Roboto', Arial, sans-serif; /* Using Roboto as a slightly more modern font */
    max-width: 1200px;
    margin: 20px auto;
    padding: 15px; /* Reduced padding slightly */
    background-color: #ffffff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); /* Softer shadow */
    border-radius: 8px;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px; /* Increased margin */
    color: #2c3e50; /* Darker, more professional blue */
    font-weight: 500;
  }

  .order-book-layout {
    display: flex;
    justify-content: space-between;
    gap: 20px; /* Increased gap */
    flex-wrap: wrap; /* Ensures responsiveness */
  }

  .asks-section, .bids-section {
    flex-grow: 1; /* Allows sections to grow equally */
    flex-basis: 0; /* Important for flex-grow to work correctly with gap */
    min-width: 300px; /* Minimum width before wrapping */
    background-color: #fdfdfd; /* Slightly off-white for sections */
    border-radius: 6px;
    padding: 15px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  h2 {
    color: #34495e; /* Slightly softer section header color */
    border-bottom: 2px solid #ecf0f1; /* Lighter border */
    padding-bottom: 10px;
    margin-top: 0; /* Remove default margin */
    margin-bottom: 15px; /* Spacing below header */
    text-align: center;
    font-weight: 500;
    font-size: 1.3em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 8px 10px; /* Adjusted padding */
    text-align: right;
    border-bottom: 1px solid #ecf0f1; /* Lighter border for rows */
  }

  th {
    background-color: #f5f7fa; /* Very light grey for headers */
    font-weight: 600; /* Slightly bolder */
    color: #566573;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
  }

  tr:last-child td { /* Remove bottom border from last row in table body */
      border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background-color: #fcfcfc; /* Very subtle striping */
  }

  tbody tr:hover {
    background-color: #f0f5ff; /* Light blue hover for interactivity */
  }
  
  .price-cell {
    font-weight: 500; /* Make price slightly bolder */
  }

  .ask-row td.price-cell {
    color: #e74c3c; /* Red for ask prices */
  }
  /* You could also color the quantity for asks if desired */
  /* .ask-row td:nth-child(2) { color: #c0392b; } */

  .bid-row td.price-cell {
    color: #2ecc71; /* Green for bid prices */
  }
  /* .bid-row td:nth-child(2) { color: #27ae60; } */

  .loading-message {
    text-align: center;
    color: #7f8c8d; /* Grey for loading message */
    padding: 20px;
    font-style: italic;
  }
</style>

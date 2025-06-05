# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
```bash
cd backend
npm run dev          # Full reset: kill port, reset database, start with nodemon
npm run dev-safe     # Safe restart: kill port, start with nodemon (no DB reset)
npm run kill-port    # Kill processes on the configured port
npm run test-auth    # Run authentication endpoint tests
npm run cookie       # Get session cookie for testing
```

### Frontend Development  
```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management
```bash
cd backend
node database/createDb.js --reset    # Reset and recreate database schema
```

## Architecture Overview

This is a **simulated cryptocurrency exchange platform** with separate backend and frontend applications.

### Backend Architecture (Node.js/Express)
- **Feature-based structure**: Each domain (`accounts`, `auth`, `cryptocurrencies`, `orders`, `trades`) has its own repository, service, and router
- **Factory pattern**: `shared/factory/factory.js` provides centralized dependency injection for all repositories and services
- **PostgreSQL database**: Connection managed via `pg` Pool in `database/connection.js`
- **Real-time trading**: WebSocket integration with Socket.IO for live order book updates
- **Trading engine**: Market order matching engine in `features/trading/orderbook/`
- **OpenAPI validation**: Swagger documentation and request/response validation
- **Session-based authentication**: Express sessions with cookie support

### Frontend Architecture (Svelte)
- **Component-based**: Modular Svelte components in `src/components/`
- **State management**: Auth store and socket store for reactive state
- **Real-time updates**: Socket.IO client for live data streaming
- **API communication**: Fetch-based HTTP requests to backend

### Key Integrations
- **Binance WebSocket**: External market data feeds (`binance-ws.js`)
- **Real-time notifications**: Trade execution and balance updates via WebSockets
- **Order matching**: In-memory order book with price-time priority matching

### Data Flow
1. Frontend components use stores for state management
2. HTTP requests go through `/api` endpoints with OpenAPI validation
3. Services coordinate business logic and database operations via repositories
4. Real-time updates broadcast through Socket.IO to connected clients
5. Trading engine processes orders and emits market updates

## Common Development Patterns

### Adding a new feature
1. Create repository class extending database operations
2. Create service class for business logic
3. Add router with Express routes and OpenAPI validation
4. Register in `shared/factory/factory.js`
5. Import router in `app.js`

### WebSocket event handling
- Market updates: `marketDataEmitter.on('marketUpdate')`
- Trade notifications: Event-driven architecture in `shared/events/`
- Client connections: Socket.IO rooms for user-specific updates

### Database operations
- All database access goes through Repository classes
- Use `db` connection pool from `database/connection.js`  
- Repositories imported via factory for consistent dependency injection
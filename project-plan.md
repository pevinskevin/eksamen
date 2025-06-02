# Cryptocurrency Exchange Platform - Product Requirements Document

## Overview

This project is a simulated cryptocurrency exchange platform designed to mimic the core functionalities of a real-world exchange. It provides users with a hands-on experience of trading digital assets in a safe, sandboxed environment.

**Target Audience:**

-   Individuals interested in learning about cryptocurrency trading
-   Developers exploring exchange mechanics
-   Educational purposes

**Key Value Proposition:**
Offers a realistic trading simulation without financial risk, incorporating features like user authentication, live order books, and simulated buy/sell transactions.

**Technology Stack:**

-   **Backend:** Node.js with Express.js
-   **Frontend:** Svelte
-   **Database:** PostgreSQL (to be confirmed)

---

## Core Features

### 1. User Authentication

**What it does:** Allows new users to create accounts and existing users to log in securely to access platform features.

**Why it's important:**

-   Fundamental security requirement
-   Protects user data (even simulated)
-   Personalizes user experience
-   Explicit exam requirement

**How it works:**

-   **Frontend:** Registration and login forms using `fetch` to send credentials to backend
-   **Backend:** Express routes handling registration (hash password, store in database) and login (verify credentials, generate session token/cookie)
-   **Database:** Stores user credentials (username, hashed password, email)

### 2. User Authorization

**What it does:** Controls what specific actions authenticated users can perform and what data they can access.

**Key Controls:**

-   Users can only view and manage their own account balances, portfolios, and trade history
-   Prevents users from placing trades on behalf of others
-   Optional admin role with broader permissions

**Why it's important:**

-   Crucial security layer on top of authentication
-   Addresses hard exam requirements
-   Ensures data integrity and user privacy

**Implementation:**

-   **Backend:** Role-based middleware checking user permissions against required actions
-   **Frontend:** Dynamic UI elements based on user role
-   **Security:** Backend enforces all authorization rules

### 3. Real-time Order Book Visualization

**What it does:**

-   Displays live, two-sided list of buy orders (bids) and sell orders (asks)
-   Shows quantity available at each price level
-   Updates in real-time as orders are placed, matched, or canceled

**Why it's important:**

-   Cornerstone of any trading interface
-   Provides market depth transparency
-   Fulfills WebSocket requirements for both frontend and backend
-   Enables informed trading decisions

**Technical Implementation:**

-   **Backend:** Maintains in-memory order book per cryptocurrency pair
-   **WebSockets:** Broadcasts order book changes to connected clients
-   **Frontend:** Real-time rendering of bid/ask lists with proper styling

### 4. Simulated Trading (Buy/Sell Orders)

**What it does:**

-   Allows authenticated users to place buy and sell orders
-   Supports limit orders with specified quantity and price
-   Potential for market orders at best available price

**Process Flow:**

1. User submits order via trading form
2. Frontend validates and sends via `fetch`
3. Backend authenticates and validates order
4. Balance check ensures sufficient funds
5. Order passed to matching engine
6. Database updated with trades and balance changes
7. Real-time notifications sent via WebSocket

### 5. Order Matching Engine

**What it does:**

-   Core backend component processing incoming orders
-   Matches buy/sell orders based on price and time priority
-   Executes trades and updates order book
-   Handles partial fills and unmatched orders

**Matching Logic:**

-   **Price Priority:** Best prices matched first
-   **Time Priority:** FIFO for orders at same price level
-   **Partial Fills:** Handles orders matched across multiple counterparties
-   **Order Book Updates:** Adds unmatched portions to appropriate side

**State Management:**

-   Atomic database transactions for balance updates
-   Trade history recording
-   Real-time WebSocket notifications

### 6. Account Balance Management

**What it does:**

-   Tracks simulated fiat currency (e.g., SIM-USD) and cryptocurrency balances
-   Updates balances from successful trades
-   Supports simulated deposits/withdrawals

**Technical Details:**

-   **Database:** Secure storage of user balances with transaction integrity
-   **API Endpoints:** RESTful access to balance information
-   **Real-time Updates:** WebSocket notifications for balance changes
-   **Integration:** Connected to trading engine and payment systems

### 7. Payment Gateway Integration (Stripe Test Mode)

**What it does:**

-   Simulates fiat currency deposits using Stripe's test environment
-   No real money involved - uses test cards and infrastructure
-   Enhances simulation realism

**Implementation:**

-   **Frontend:** Stripe Elements integration for secure card collection
-   **Backend:** Stripe API integration for test payment processing
-   **Database:** Balance updates upon successful test payments
-   **Security:** Proper token handling and validation

### 8. Crypto Wallet Integration (Phantom/MetaMask)

**What it does:**

-   Simulated cryptocurrency deposits from testnet wallets
-   Withdrawal capabilities to external testnet addresses
-   Integration with browser wallet extensions

**Supported Wallets:**

-   **Phantom:** Solana testnet integration
-   **MetaMask:** Ethereum testnet (Sepolia) integration

**Process Flow:**

-   **Deposits:** Monitor testnet addresses for incoming transactions
-   **Withdrawals:** Backend-initiated transactions to user-provided addresses
-   **Confirmation:** Blockchain confirmation before balance updates

### 9. Backend API (Express.js)

**Responsibilities:**

-   Server-side logic and HTTP endpoints
-   WebSocket connection management
-   Database interactions
-   Third-party service integrations
-   Core business logic implementation

**Structure:**

-   RESTful API design
-   Middleware for authentication, authorization, validation
-   Error handling and logging
-   Order matching engine integration

### 10. Frontend Interface (Svelte)

**Responsibilities:**

-   User interface and experience
-   Real-time data visualization
-   Form handling and validation
-   WebSocket client management
-   Third-party integration (Stripe, wallets)

**Technical Features:**

-   Single-page application (SPA)
-   Reactive component system
-   State management
-   Responsive design
-   Consistent styling

---

## User Experience

### User Personas

#### 1. The Curious Learner (Primary)

**Background:** Students, hobbyists, or individuals new to cryptocurrency trading

**Goals:**

-   Understand cryptocurrency exchange mechanics
-   Learn in risk-free environment
-   Gain practical trading experience

**Needs:**

-   Simple, intuitive interface
-   Clear explanations and tooltips
-   Easy onboarding with simulated funds
-   Visual feedback on trades

#### 2. The Aspiring Developer/Student (Secondary)

**Background:** Computer science students, blockchain developers, fintech enthusiasts

**Goals:**

-   See functional full-stack application example
-   Understand real-time data systems
-   Learn about financial system architecture

**Needs:**

-   Clear technical demonstration
-   Visible data flow
-   Understanding of component interactions

### Key User Flows

#### 1. User Onboarding

1. Land on homepage/login page
2. Click "Register"
3. Complete registration form
4. Account creation and login
5. Optional: Initial fund deposit via Stripe
6. Optional: Crypto deposit via wallet integration

#### 2. Making a Trade

1. User login and navigation to trading interface
2. Select cryptocurrency pair
3. View real-time order book
4. Complete trade form (buy/sell, quantity, price)
5. Order submission and validation
6. Immediate feedback (success/error)
7. Real-time updates (order book, balance, history)

#### 3. Account Management

1. Navigate to account dashboard
2. View current balances (fiat and crypto)
3. Review open orders and trade history
4. Manage deposits/withdrawals
5. Account settings and preferences

### UI/UX Considerations

-   **Clarity and Simplicity:** Uncluttered interface avoiding jargon
-   **Responsiveness:** Desktop-focused with basic mobile usability
-   **Real-time Feedback:** Immediate visual updates via WebSocket
-   **Consistency:** Unified design language and interaction patterns
-   **Error Handling:** Clear, user-friendly error messages
-   **Performance:** Smooth order book updates and responsive interface
-   **Accessibility:** Basic accessibility principles and keyboard navigation

---

## Technical Architecture

### System Components

#### 1. Frontend Application (Client-Side)

**Technology:** Svelte/SvelteKit

**Responsibilities:**

-   User interface rendering
-   Client-side state management
-   User input handling
-   HTTP communication via `fetch`
-   WebSocket connection management
-   Wallet extension integration
-   Stripe.js integration

#### 2. Backend Application (Server-Side)

**Technology:** Node.js with Express.js

**Responsibilities:**

-   RESTful API endpoints
-   Authentication and authorization
-   Business logic implementation
-   Order Matching Engine
-   WebSocket server management
-   Database interactions
-   Third-party service integration

#### 3. Database

**Technology:** PostgreSQL (pending research confirmation)

**Responsibilities:**

-   User account information storage
-   Balance management (fiat and crypto)
-   Order and trade history
-   Cryptocurrency definitions
-   Transaction records

#### 4. Real-time Communication Layer

**Technology:** WebSockets (ws library or socket.io)

**Responsibilities:**

-   Live order book streaming
-   Real-time notifications
-   User-specific updates
-   Connection management

### Data Models

#### User

```sql
user_id (Primary Key)
email (Unique)
password_hash
role ('user', 'admin')
created_at, updated_at
```

#### Account (Fiat Balance)

```sql
account_id (Primary Key)
user_id (Foreign Key)
currency_code ('SIM_USD')
balance (Decimal)
created_at, updated_at
```

#### CryptoHolding

```sql
holding_id (Primary Key)
user_id (Foreign Key)
cryptocurrency_id (Foreign Key)
balance (Decimal)
created_at, updated_at
```

#### Cryptocurrency

```sql
cryptocurrency_id (Primary Key)
symbol ('SIM_BTC', 'SIM_ETH')
name ('Simulated Bitcoin')
description
icon_url, decimals_of_precision
is_active (Boolean)
```

#### Order

```sql
order_id (Primary Key)
user_id (Foreign Key)
cryptocurrency_id (Foreign Key)
type ('buy', 'sell')
order_type ('limit', 'market')
quantity_total (Decimal)
quantity_remaining (Decimal)
price (Decimal)
status ('open', 'partially_filled', 'fully_filled', 'cancelled')
created_at, updated_at
```

#### Trade

```sql
trade_id (Primary Key)
order_id (Foreign Key)
cryptocurrency_id (Foreign Key)
quantity (Decimal)
price (Decimal)
buyer_user_id (Foreign Key) - (user if buying, 999 for Binance if user is selling)
seller_user_id (Foreign Key) - (user if selling, 999 for Binance if user is buying)
trade_timestamp
```

#### Transaction

```sql
transaction_id (Primary Key)
user_id (Foreign Key)
type ('deposit_fiat', 'withdrawal_fiat', 'deposit_crypto', 'withdrawal_crypto')
currency_code_or_crypto_id
amount (Decimal)
status ('pending', 'completed', 'failed')
external_transaction_id
timestamp
```

### APIs and Integrations

**Internal APIs:**

-   RESTful API (Express backend)
-   WebSocket API (real-time data)

**External APIs:**

-   **Stripe API:** Simulated fiat deposits
-   **Blockchain APIs:** Testnet monitoring and transactions
-   **Binance WebSocket (Optional):** External price feeds for reference

---

## Development Roadmap

### Phase 1: Core Backend & Foundational Features (MVP)

**Goal:** Establish backend server, database, authentication, and basic trading structures

**Tasks:**

1. **Project Setup & Basic Server**

    - Initialize Node.js project with Express.js
    - Configure project structure and tooling
    - Database selection and setup
    - Initial schema design and migrations

2. **User Authentication & Authorization**

    - User model and database interactions
    - Registration and login endpoints
    - Session/JWT management
    - Route protection middleware

3. **Cryptocurrency Management**

    - Cryptocurrency listings API
    - Database seeding with test currencies

4. **Account Balance Management - Core**

    - Balance retrieval endpoints
    - Initial balance assignment for new users
    - Balance display frontend

5. **Basic Order Placement**

    - Order submission API (no matching)
    - Order validation and persistence
    - Open orders display

6. **WebSocket Setup - Basic**
    - WebSocket server integration
    - Basic client connection

### Phase 2: Order Book & Matching Engine (MVP Core)

**Goal:** Implement the exchange's core trading functionality

**Tasks:**

1. **In-Memory Order Book**

    - Order book data structures
    - Order addition logic

2. **Order Matching Engine - V1**

    - Price-time priority matching
    - Balance updates and trade recording
    - Order book maintenance

3. **Real-time Order Book Visualization**

    - WebSocket broadcasting for book updates
    - Frontend order book display
    - Real-time synchronization

4. **Real-time Notifications**
    - Trade confirmation messages
    - Balance update notifications
    - Error handling and feedback

### Phase 3: Enhanced UX & Integrations (MVP Polish)

**Goal:** Add key integrations and refine user experience

**Tasks:**

1. **Stripe Integration**

    - Frontend Stripe Elements integration
    - Backend payment processing
    - Balance crediting system

2. **Frontend Styling & Layout**

    - Consistent design system
    - Responsive layout
    - User experience improvements

3. **Trade History Display**

    - Historical trade data retrieval
    - Trade history interface

4. **Basic Crypto Wallet Integration (Optional)**
    - Single-direction deposit monitoring
    - Testnet address management

### Future Enhancements (Post-MVP)

-   Full crypto wallet integration (deposits & withdrawals)
-   Advanced order types (market orders, stop-loss)
-   Price charts and technical analysis
-   Admin panel and system management
-   Enhanced UI/UX and mobile responsiveness
-   GDPR compliance features
-   Comprehensive testing suite
-   Production deployment

---

## Logical Dependency Chain

The development follows a structured progression building foundational elements first:

### 1. Foundation - Server & Database Setup

**Why First:** No functionality possible without running backend and structured database
**Enables:** All subsequent backend development

### 2. Core Identity - Authentication & Authorization

**Why Next:** User-specific features require secure user identification
**Enables:** Personalized data access and user-specific actions

### 3. Market Basics - Cryptocurrency Listings & Balances

**Why Next:** Users need context for trading (available markets and funds)
**Enables:** Trading preparation and user understanding

### 4. Core Interaction - Basic Order Placement

**Why Next:** Primary user action (order placement) needs to be functional
**Enables:** Frontend-backend integration testing and raw material for matching

### 5. Real-time Foundation - WebSocket Setup

**Why Next:** Essential for order book and notification streaming
**Enables:** All real-time features

### 6. The Engine - Order Book & Matching Logic

**Why Next:** Core exchange functionality that makes simulation work
**Enables:** Actual trade execution and market dynamics

### 7. Visibility - Real-time Visualization & Notifications

**Why Next:** Users need to see market activity and trade outcomes
**Enables:** Complete trading experience and immediate feedback

### 8. Usability & Realism - UI/UX & Integrations

**Why Next:** Polish for demonstration and feature completeness
**Enables:** Professional presentation and comprehensive capabilities

### 9. Production Readiness - Compliance & Cleanup

**Why Throughout:** Essential for clean, compliant project submission
**Enables:** Professional-grade deliverable

---

## Risks and Mitigations

### 1. Order Matching Engine Complexity

**Risk:** Complex logic prone to bugs (price-time priority, partial fills, atomic updates)

**Mitigation:**

-   Start with simplified version
-   Comprehensive unit testing
-   Modular function design
-   Reference existing documentation
-   Extensive logging during development

### 2. Real-time Communication Issues

**Risk:** WebSocket reliability, state synchronization, performance bottlenecks

**Mitigation:**

-   Choose robust WebSocket library
-   Careful message format design
-   Efficient frontend data structures
-   Performance testing with multiple connections
-   Consider update throttling if needed

### 3. Scope Creep / Time Constraints

**Risk:** Too many features jeopardizing core MVP completion

**Mitigation:**

-   Strict adherence to phased roadmap
-   Clear "done" definitions for features
-   Regular progress reviews
-   Defer non-essential enhancements

### 4. Database Design Complexity

**Risk:** Schema design and transactional integrity challenges

**Mitigation:**

-   Thorough database research and selection
-   Careful schema planning
-   Proper transaction usage
-   Rigorous testing of database interactions

### 5. Third-Party Integration Challenges

**Risk:** External service integration issues (APIs, authentication, callbacks)

**Mitigation:**

-   Start with simplest integration approach
-   Thorough documentation review
-   Official SDK usage
-   Dedicated testing time
-   Fallback plans for complex integrations

### 6. Production Quality Requirements

**Risk:** Meeting "production ready" standards (clean code, GDPR, no debug logs)

**Mitigation:**

-   Clean code practices from start
-   Regular debug log cleanup
-   Periodic code reviews
-   GDPR considerations throughout development
-   Final quality check allocation

### 7. Frontend State Management Complexity

**Risk:** Complex state management and performance issues in Svelte

**Mitigation:**

-   Leverage Svelte's built-in stores
-   Component modularity
-   Understanding of Svelte reactivity
-   Consider SvelteKit if beneficial

---

## Appendix

### Key Decisions & Research Points

#### Database Choice

-   **Requirement:** Justified database choice with terminal access and query capabilities
-   **Current Leaning:** PostgreSQL for structured data and transactional integrity
-   **Action:** Focused research and decision documentation

#### Session Management

-   **Options:** JWT vs. cookie-based sessions
-   **Considerations:** Security, SPA compatibility, implementation complexity
-   **Action:** Research best practices for Express.js and Svelte combination

#### Order Book Data Strategy

-   **Options:** Full snapshots vs. delta updates
-   **Initial Plan:** Full snapshots for MVP simplicity
-   **Future:** Delta optimization for performance

#### External Price Feed Role

-   **Purpose:** Reference pricing vs. market seeding
-   **Decision:** Display as reference price for MVP
-   **Note:** Should not directly execute trades against external feeds

### Exam Requirements Checklist

#### Hard Requirements

-   [ ] **Backend: Express.js** - Web framework implementation
-   [ ] **Backend: Database** - Choice justified, terminal access, query capability
-   [ ] **Backend: Sockets** - Real-time communication
-   [ ] **Backend: Authentication & Authorization** - Secure user management
-   [ ] **Frontend: Svelte** - UI framework implementation
-   [ ] **Frontend: Fetch** - HTTP request handling
-   [ ] **Frontend: Sockets** - Real-time data reception
-   [ ] **Frontend: Authentication & Authorization** - User interface security
-   [ ] **Production Ready: Clean Code** - No console logs, unused code, unfinished snippets
-   [ ] **Production Ready: GDPR Compliance** - Legal website requirements

#### Soft Requirements

-   [ ] **Clean Codebase** - Well-organized and maintainable code
-   [ ] **Consistent Code Style** - Uniform formatting and conventions
-   [ ] **Website Styling** - Visual design effort
-   [ ] **User Experience** - Intuitive and engaging interface

#### Optional

-   [ ] **Application Hosting** - Live deployment

### Potential Libraries & Tools

#### Backend

-   **Security:** `bcryptjs` or `argon2` (password hashing), `jsonwebtoken` (JWT)
-   **Communication:** `ws` or `socket.io` (WebSockets)
-   **Database:** `pg` (PostgreSQL), `mysql2` (MySQL), `mongodb` (MongoDB)
-   **ORM/Query Builder:** Sequelize, Knex.js, Mongoose (optional)
-   **Integrations:** `stripe` (payments), `ethers.js`, `@solana/web3.js` (blockchain)

#### Frontend

-   **Wallets:** Solana Wallet Adapter, Ethers.js for MetaMask
-   **Payments:** Stripe.js, Stripe Elements
-   **Utilities:** `date-fns` (date formatting)
-   **Styling:** Tailwind CSS, Pico.CSS, OpenProps (optional)
-   **Charts:** Chart.js, TradingView (future enhancement)

### Document References

-   `depthcache-documentation.md` - Order book implementation guidance
-   `binance-ws.js` - External WebSocket integration script
-   Exam Description PDF - Official requirements and guidelines

---

_This PRD serves as the comprehensive blueprint for developing a fully-functional simulated cryptocurrency exchange platform that meets all academic requirements while providing a realistic and engaging user experience._

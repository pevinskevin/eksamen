import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new client for each operation
function createClient() {
    return new Client();
}

export async function createTables() {
    const client = createClient();

    try {
        await client.connect();
        console.log('Creating database schema...');

        // Step 1: Create ENUM types
        console.log('Creating ENUM types...');

        await client.query(`
      -- User roles
      CREATE TYPE user_role AS ENUM ('user', 'admin', 'system');
      
      -- Order types
      CREATE TYPE order_type AS ENUM ('limit', 'market');
      CREATE TYPE order_variant AS ENUM ('buy', 'sell');
      CREATE TYPE order_status AS ENUM ('open', 'partially_filled', 'fully_filled', 'cancelled');
      
      -- Transaction types
      CREATE TYPE transaction_type AS ENUM (
        'deposit_fiat', 
        'withdrawal_fiat', 
        'deposit_crypto', 
        'withdrawal_crypto'
      );
      CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
    `);
        console.log('✓ Created ENUM types');

        // Step 2: Create tables using the ENUMs

        // User table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role user_role DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created users table');

        // Cryptocurrency table
        await client.query(`
      CREATE TABLE IF NOT EXISTS cryptocurrencies (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created cryptocurrencies table');

        // Account table (for USD balance)
        await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        currency_code VARCHAR(10) DEFAULT 'SIM_USD',
        balance DECIMAL(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, currency_code)
      )
    `);
        console.log('✓ Created accounts table');

        // CryptoHolding table (base table)
        await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_holdings_base (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        cryptocurrency_id INTEGER REFERENCES cryptocurrencies(id),
        balance DECIMAL(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, cryptocurrency_id)
      )
    `);
        console.log('✓ Created crypto_holdings_base table');

        // Create the crypto_holdings view AFTER the base tables exist
        await client.query(`
      CREATE OR REPLACE VIEW crypto_holdings AS
      SELECT 
        chb.id,
        chb.user_id,
        chb.cryptocurrency_id,
        chb.balance,
        chb.created_at,
        chb.updated_at,
        c.symbol,
        c.name,
        c.description,
        c.icon_url
      FROM crypto_holdings_base chb
      JOIN cryptocurrencies c ON chb.cryptocurrency_id = c.id
    `);
        console.log('✓ Created crypto_holdings view');

        // Order table
        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        cryptocurrency_id INTEGER REFERENCES cryptocurrencies(id),
        order_type order_type NOT NULL,
        order_variant order_variant NOT NULL,
        quantity_total DECIMAL(20, 8) NOT NULL,
        quantity_remaining DECIMAL(20, 8) NOT NULL,
        price DECIMAL(20, 8),
        status order_status DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created orders table');

        // Trade table
        await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        cryptocurrency_id INTEGER REFERENCES cryptocurrencies(id),
        quantity DECIMAL(20, 8) NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        buyer_user_id INTEGER REFERENCES users(id),
        seller_user_id INTEGER REFERENCES users(id),
        trade_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created trades table');

        // Transaction table
        await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type transaction_type NOT NULL,
        currency_code_or_crypto_id VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        status transaction_status DEFAULT 'pending',
        external_transaction_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created transactions table');

        // Step 3: Insert sample cryptocurrencies
        await client.query(`
      INSERT INTO cryptocurrencies (symbol, name, description)
      VALUES 
        ('BTC', 'Bitcoin', 'Simulated Bitcoin'),
        ('ETH', 'Ethereum', 'Simulated Ethereum'),
        ('BNB', 'Binance Coin', 'Simulated BNB'),
        ('LTC', 'Litecoin', 'Simulated Litecoin')
      ON CONFLICT (symbol) DO NOTHING
    `);
        console.log('✓ Added sample cryptocurrencies');

        // test1234
        const testPasswordHash = '$2b$12$dfLA6yiDAoKXRE46e0SRsucUvOG/uH6/heHRtDWrNDyHNy/rkgAUS'; // In real app: await bcrypt.hash('admin', 10)

        await client.query(
            `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ('admin@test.com', $1, 'Admin', 'User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `,
            [testPasswordHash]
        );
        console.log('✓ Added test admin user (admin@test.com / password: test)');

        // Create Binance system user with ID 999 to represent Binance as counterparty
        await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role)
      VALUES (999, 'system@binance.local', 'SYSTEM_ACCOUNT', 'Binance', 'System', 'system')
      ON CONFLICT (id) DO NOTHING
    `);
        console.log('✓ Added Binance system user (ID: 999)');

        // Create crypto holdings for admin user for BTC, ETH, and BNB
        await client.query(`
      INSERT INTO crypto_holdings_base (user_id, cryptocurrency_id, balance)
      SELECT u.id, c.id, 
        CASE 
          WHEN c.symbol = 'BTC' THEN 1.5
          WHEN c.symbol = 'ETH' THEN 10.0
          WHEN c.symbol = 'BNB' THEN 50.0
        END as balance
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com'
      ON CONFLICT (user_id, cryptocurrency_id) DO NOTHING
    `);
        console.log('✓ Added sample crypto holdings for admin');

        // Also create a fiat account for the admin user
        await client.query(`
      INSERT INTO accounts (user_id, currency_code, balance)
      SELECT id, 'SIM_USD', 1000000.00
      FROM users 
      WHERE email = 'admin@test.com'
      ON CONFLICT (user_id, currency_code) DO NOTHING
    `);
        console.log('✓ Added $1,000,000 SIM_USD balance for admin');

        // Create a sample order for the admin user
        await client.query(`
      INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price)
      SELECT u.id, c.id, 'limit', 'sell', 0.05, 0.05, 45000.00
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com' AND c.symbol = 'BTC'
    `);
        console.log('✓ Added sample BTC sell order for admin');

        // Add another BTC order (buy order this time)
        await client.query(`
      INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price)
      SELECT u.id, c.id, 'limit', 'buy', 0.05, 0.05, 44000.00
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com' AND c.symbol = 'BTC'
    `);
        console.log('✓ Added sample BTC buy order for admin');

        // Add an ETH order
        await client.query(`
      INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price)
      SELECT u.id, c.id, 'limit', 'sell', 0.5, 0.5, 3200.00
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com' AND c.symbol = 'ETH'
    `);
        console.log('✓ Added sample ETH sell order for admin');

        // Add another BTC buy order
        await client.query(`
      INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price)
      SELECT u.id, c.id, 'limit', 'buy', 0.1, 0.1, 43500.00
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com' AND c.symbol = 'BTC'
    `);
        console.log('✓ Added additional BTC buy order for admin');

        // Add another BTC sell order
        await client.query(`
      INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price)
      SELECT u.id, c.id, 'limit', 'sell', 0.3, 0.3, 45500.00
      FROM users u
      CROSS JOIN cryptocurrencies c
      WHERE u.email = 'admin@test.com' AND c.symbol = 'BTC'
    `);
        console.log('✓ Added additional BTC sell order for admin');

        console.log('\n✅ Database schema created successfully!');
    } catch (err) {
        // Check if error is because types already exist
        if (err.code === '42710') {
            console.log("Note: Some types already exist, that's okay!");
        } else {
            console.error('Error:', err.message);
            throw err;
        }
    } finally {
        await client.end();
    }
}

// Optional: Function to drop everything (useful for development)
export async function dropTables() {
    const client = createClient();

    try {
        await client.connect();
        console.log('Dropping all tables and types...');

        // Drop the view first
        await client.query(`
      DROP VIEW IF EXISTS crypto_holdings CASCADE;
    `);

        // Drop tables in correct order (reverse of creation, respecting foreign keys)
        await client.query(`
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS trades CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS crypto_holdings_base CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
      DROP TABLE IF EXISTS cryptocurrencies CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

        // Then drop the types
        await client.query(`
      DROP TYPE IF EXISTS transaction_status CASCADE;
      DROP TYPE IF EXISTS transaction_type CASCADE;
      DROP TYPE IF EXISTS order_status CASCADE;
      DROP TYPE IF EXISTS order_variant CASCADE;
      DROP TYPE IF EXISTS order_type CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);

        console.log('✅ Dropped everything successfully!');
    } catch (err) {
        console.error('Error dropping:', err.message);
    } finally {
        await client.end();
    }
}

// Check command line arguments
const command = process.argv[2];

async function main() {
    if (command === '--drop') {
        await dropTables();
    } else if (command === '--reset') {
        await dropTables();
        await createTables();
    } else {
        await createTables();
    }
}

main().catch(console.error);

// Usage:
// node createDb.js          # Create tables
// node createDb.js --drop   # Drop everything
// node createDb.js --reset  # Drop and recreate everything

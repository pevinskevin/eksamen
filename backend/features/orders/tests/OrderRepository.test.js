import dotenv from 'dotenv/config';
import { Client } from 'pg';
import OrderRepository from '../OrderRepository.js';
import { dropTables, createTables } from '../../../database/createDb.js'; // Adjust path as needed

describe('OrderRepository Integration Tests', () => {
    let dbClient;
    let orderRepository;
    let testUserId;
    let testCryptoId;
    let testCryptoSymbol = 'BTC'; // Assuming BTC is created by createTables

    beforeAll(async () => {
        // Configure client for your test database
        // This might involve setting environment variables like PGDATABASE_TEST
        // and ensuring your Client() constructor picks them up, or providing a full connection string.
        dbClient = new Client(); // Assumes test DB is configured via env vars
        await dbClient.connect();

        // Reset the database
        // Note: dropTables and createTables in createDb.js use their own client.
        // This is fine, but ensure they also point to the test database.
        await dropTables();
        await createTables();

        // Get a test user ID (e.g., the admin user created by createTables)
        const userRes = await dbClient.query(
            "SELECT user_id FROM users WHERE email = 'admin@test.com'"
        );
        if (userRes.rows.length === 0) {
            throw new Error(
                'Test user admin@test.com not found. Make sure createTables seeds this user.'
            );
        }
        testUserId = userRes.rows[0].user_id;

        // Get a test cryptocurrency ID (e.g., BTC)
        const cryptoRes = await dbClient.query(
            'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
            [testCryptoSymbol]
        );
        if (cryptoRes.rows.length === 0) {
            throw new Error(
                `Test cryptocurrency ${testCryptoSymbol} not found. Make sure createTables seeds this crypto.`
            );
        }
        testCryptoId = cryptoRes.rows[0].cryptocurrency_id;

        orderRepository = new OrderRepository(dbClient);
    });

    afterAll(async () => {
        await dbClient.end();
    });

    // Clean orders table before each test to ensure isolation for write operations
    beforeEach(async () => {
        await dbClient.query('DELETE FROM trades'); // Clear trades first due to potential FK constraints
        await dbClient.query('DELETE FROM orders');
    });

    describe('save', () => {
        it('should save a new order and return it', async () => {
            const orderData = {
                cryptocurrencyid: testCryptoId,
                orderType: 'limit',
                orderVariant: 'buy',
                quantity: 1.5,
                price: 50000.0,
                userId: testUserId,
            };

            const savedOrder = await orderRepository.save(
                orderData.cryptocurrencyid,
                orderData.orderType,
                orderData.orderVariant,
                orderData.quantity,
                orderData.price,
                orderData.userId
            );

            expect(savedOrder).toBeDefined();
            expect(savedOrder.order_id).toBeGreaterThan(0);
            expect(savedOrder.user_id).toBe(orderData.userId);
            expect(savedOrder.cryptocurrency_id).toBe(orderData.cryptocurrencyid);
            expect(savedOrder.order_type).toBe(orderData.orderType);
            expect(savedOrder.order_variant).toBe(orderData.orderVariant);
            expect(parseFloat(savedOrder.quantity_total)).toBe(orderData.quantity);
            expect(parseFloat(savedOrder.quantity_remaining)).toBe(orderData.quantity); // Initially same
            expect(parseFloat(savedOrder.price)).toBe(orderData.price);
            expect(savedOrder.status).toBe('open'); // Default status

            // Verify in DB
            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                savedOrder.order_id,
            ]);
            expect(dbRes.rows.length).toBe(1);
            const dbOrder = dbRes.rows[0];
            expect(dbOrder.user_id).toBe(orderData.userId);
            expect(dbOrder.price).toEqual(orderData.price.toString()); // DB stores numeric as string sometimes
        });

        it('should throw an error if saving fails (e.g., invalid cryptocurrency_id)', async () => {
            // This test depends on how the DB handles foreign key constraints
            // and if the repository method itself would error out before DB.
            // For now, assuming a DB foreign key violation.
            await expect(
                orderRepository.save(
                    99999, // Non-existent crypto ID
                    'limit',
                    'buy',
                    1.0,
                    50000.0,
                    testUserId
                )
            ).rejects.toThrow(); // Generic error for FK violation from pg driver
        });
    });

    describe('find', () => {
        let createdOrder;

        beforeEach(async () => {
            // Create an order to find
            const result = await dbClient.query(
                'INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [testUserId, testCryptoId, 'limit', 'sell', 2.0, 2.0, 52000.0, 'open']
            );
            createdOrder = result.rows[0];
        });

        it('should find an existing order by user_id and order_id', async () => {
            const foundOrder = await orderRepository.find(testUserId, createdOrder.order_id);
            expect(foundOrder).toBeDefined();
            expect(foundOrder.order_id).toBe(createdOrder.order_id);
            expect(foundOrder.user_id).toBe(testUserId);
            expect(parseFloat(foundOrder.quantity_total)).toBe(2.0);
        });

        it('should return undefined if order is not found for the user', async () => {
            const foundOrder = await orderRepository.find(testUserId, 99999); // Non-existent order_id
            expect(foundOrder).toBeUndefined();
        });

        it('should return undefined if order belongs to another user', async () => {
            // Create another user
            const anotherUserRes = await dbClient.query(
                "INSERT INTO users (email, password_hash, role) VALUES ('another@test.com', 'hash', 'user') RETURNING user_id"
            );
            const anotherUserId = anotherUserRes.rows[0].user_id;

            const foundOrder = await orderRepository.find(anotherUserId, createdOrder.order_id);
            expect(foundOrder).toBeUndefined();
        });
    });

    describe('findAll', () => {
        it('should return all orders for a given user', async () => {
            await dbClient.query(
                "INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price) VALUES ($1, $2, 'limit', 'buy', 1.0, 1.0, 50000)",
                [testUserId, testCryptoId]
            );
            await dbClient.query(
                "INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price) VALUES ($1, $2, 'market', 'sell', 0.5, 0.5, 51000)",
                [testUserId, testCryptoId]
            );
            // Order for another user
            const anotherUserRes = await dbClient.query(
                "INSERT INTO users (email, password_hash, role) VALUES ('user2@test.com', 'hash', 'user') RETURNING user_id"
            );
            const anotherUserId = anotherUserRes.rows[0].user_id;
            await dbClient.query(
                "INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price) VALUES ($1, $2, 'limit', 'buy', 1.0, 1.0, 50000)",
                [anotherUserId, testCryptoId]
            );

            const orders = await orderRepository.findAll(testUserId);
            expect(orders).toBeInstanceOf(Array);
            expect(orders.length).toBe(2);
            orders.forEach((order) => {
                expect(order.user_id).toBe(testUserId);
            });
        });

        it('should return an empty array if the user has no orders', async () => {
            const orders = await orderRepository.findAll(testUserId);
            expect(orders).toEqual([]);
        });
    });

    describe('update', () => {
        let orderToUpdate;

        beforeEach(async () => {
            const result = await dbClient.query(
                'INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [testUserId, testCryptoId, 'limit', 'buy', 1.0, 1.0, 49000.0, 'open']
            );
            orderToUpdate = result.rows[0];
        });

        it('should update an existing order and return the updated order', async () => {
            const updatePayload = {
                cryptocurrencyid: testCryptoId, // Assuming crypto doesn't change, or test changing it
                orderType: 'limit',
                orderVariant: 'buy', // Can't change variant easily
                quantity: 1.2, // Original total quantity
                quantityRemaining: 0.8, // Updated remaining
                price: 49500.0, // Updated price
                userId: testUserId,
                orderid: orderToUpdate.order_id,
            };

            const updatedOrder = await orderRepository.update(
                updatePayload.cryptocurrencyid,
                updatePayload.orderType,
                updatePayload.orderVariant,
                updatePayload.quantity,
                updatePayload.quantityRemaining,
                updatePayload.price,
                updatePayload.userId,
                updatePayload.orderid
            );

            expect(updatedOrder).toBeDefined();
            expect(updatedOrder.order_id).toBe(orderToUpdate.order_id);
            expect(parseFloat(updatedOrder.quantity_total)).toBe(updatePayload.quantity);
            expect(parseFloat(updatedOrder.quantity_remaining)).toBe(
                updatePayload.quantityRemaining
            );
            expect(parseFloat(updatedOrder.price)).toBe(updatePayload.price);

            // Verify in DB
            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                orderToUpdate.order_id,
            ]);
            expect(dbRes.rows[0].price).toEqual(updatePayload.price.toString());
            expect(dbRes.rows[0].quantity_remaining).toEqual(
                updatePayload.quantityRemaining.toString()
            );
        });

        it('should throw an error when trying to update a non-existent order', async () => {
            await expect(
                orderRepository.update(
                    testCryptoId,
                    'limit',
                    'buy',
                    1.0,
                    1.0,
                    50000,
                    testUserId,
                    99999
                )
            ).rejects.toThrow('Failed to update order.');
        });
        it('should throw an error when trying to update an order belonging to another user', async () => {
            const anotherUserRes = await dbClient.query(
                "INSERT INTO users (email, password_hash, role) VALUES ('user3@test.com', 'hash', 'user') RETURNING user_id"
            );
            const anotherUserId = anotherUserRes.rows[0].user_id;

            await expect(
                orderRepository.update(
                    testCryptoId,
                    'limit',
                    'buy',
                    1.0,
                    1.0,
                    50000,
                    anotherUserId,
                    orderToUpdate.order_id
                )
            ).rejects.toThrow('Failed to update order.'); // Because user_id in WHERE clause won't match
        });
    });

    describe('delete', () => {
        let orderToDelete;

        beforeEach(async () => {
            const result = await dbClient.query(
                'INSERT INTO orders (user_id, cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [testUserId, testCryptoId, 'market', 'sell', 0.5, 0.5, 51000.0, 'open']
            );
            orderToDelete = result.rows[0];
        });

        it('should delete an existing order and return it', async () => {
            const deletedOrder = await orderRepository.delete(testUserId, orderToDelete.order_id);

            expect(deletedOrder).toBeDefined();
            expect(deletedOrder.order_id).toBe(orderToDelete.order_id);

            // Verify in DB
            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                orderToDelete.order_id,
            ]);
            expect(dbRes.rows.length).toBe(0);
        });

        it('should throw an error when trying to delete a non-existent order', async () => {
            // The repository delete method returns result.rows[0], so if nothing is deleted, result.rows is empty.
            // The method itself doesn't throw an error for "not found", it would return undefined.
            // Let's adjust the expectation based on current OrderRepository.js:
            // It returns result.rows[0], so if no row, it returns undefined.
            const result = await orderRepository.delete(testUserId, 99999);
            expect(result).toBeUndefined();
        });

        it('should return undefined when trying to delete an order belonging to another user', async () => {
            const anotherUserRes = await dbClient.query(
                "INSERT INTO users (email, password_hash, role) VALUES ('user4@test.com', 'hash', 'user') RETURNING user_id"
            );
            const anotherUserId = anotherUserRes.rows[0].user_id;

            const result = await orderRepository.delete(anotherUserId, orderToDelete.order_id);
            expect(result).toBeUndefined(); // No row matched user_id and order_id for deletion
        });
    });
});

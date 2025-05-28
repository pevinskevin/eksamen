import dotenv from 'dotenv/config';
import { Client } from 'pg';
import OrderRepository from '../OrderRepository.js';
import OrderService from '../OrderService.js';
import { orderSchema } from '../ordersValidation.js'; // For direct validation tests
import { dropTables, createTables } from '../../../database/createDb.js';
import { ValiError } from 'valibot';

describe('OrderService Integration Tests', () => {
    let dbClient;
    let orderRepository;
    let orderService;
    let testUserId;
    let testCryptoId;
    const testCryptoSymbol = 'BTC';

    beforeAll(async () => {
        dbClient = new Client(); // Assumes test DB is configured via env vars
        await dbClient.connect();

        await dropTables();
        await createTables();

        const userRes = await dbClient.query(
            "SELECT user_id FROM users WHERE email = 'admin@test.com'"
        );
        if (userRes.rows.length === 0) throw new Error('Test user admin@test.com not found.');
        testUserId = userRes.rows[0].user_id;

        const cryptoRes = await dbClient.query(
            'SELECT cryptocurrency_id FROM cryptocurrencies WHERE symbol = $1',
            [testCryptoSymbol]
        );
        if (cryptoRes.rows.length === 0)
            throw new Error(`Test crypto ${testCryptoSymbol} not found.`);
        testCryptoId = cryptoRes.rows[0].cryptocurrency_id;

        orderRepository = new OrderRepository(dbClient);
        orderService = new OrderService(orderRepository);
    });

    afterAll(async () => {
        await dbClient.end();
    });

    beforeEach(async () => {
        await dbClient.query('DELETE FROM trades');
        await dbClient.query('DELETE FROM orders');
    });

    describe('validate', () => {
        it('should validate a correct order object successfully', async () => {
            const validOrderObject = {
                cryptocurrencyid: testCryptoId,
                orderType: 'limit',
                orderVariant: 'buy',
                quantity: 1.0,
                price: 50000,
            };
            await expect(orderService.validate(validOrderObject)).resolves.toEqual(
                validOrderObject
            );
        });

        it('should throw ValiError for missing cryptocurrencyid', async () => {
            const invalidOrder = {
                orderType: 'limit',
                orderVariant: 'buy',
                quantity: 1,
                price: 50000,
            };
            await expect(orderService.validate(invalidOrder)).rejects.toThrow(ValiError);
        });

        it('should throw ValiError for invalid quantity (too small)', async () => {
            const invalidOrder = {
                cryptocurrencyid: testCryptoId,
                orderType: 'limit',
                orderVariant: 'buy',
                quantity: 0.001,
                price: 50000,
            };
            await expect(orderService.validate(invalidOrder)).rejects.toThrow(ValiError);
        });

        it('should throw ValiError for invalid price (too small for limit order)', async () => {
            const invalidOrder = {
                cryptocurrencyid: testCryptoId,
                orderType: 'limit',
                orderVariant: 'buy',
                quantity: 1,
                price: 0,
            };
            await expect(orderService.validate(invalidOrder)).rejects.toThrow(ValiError);
        });

        it('should pass validation if price is undefined for a market order (if schema allows)', async () => {
            // ordersValidation.js makes price optional, this depends on how you want to handle market order price
            // For now, assuming schema allows optional price, which implies market orders might not need it here.
            const marketOrder = {
                cryptocurrencyid: testCryptoId,
                orderType: 'market',
                orderVariant: 'buy',
                quantity: 1,
            };
            await expect(orderService.validate(marketOrder)).resolves.toEqual(marketOrder);
        });
    });

    describe('save', () => {
        it('should save a new order and return it with an ID', async () => {
            const savedOrder = await orderService.save(
                testCryptoId,
                'limit',
                'buy',
                1.5,
                50000.0,
                testUserId
            );

            expect(savedOrder).toBeDefined();
            expect(savedOrder.order_id).toBeGreaterThan(0);
            expect(savedOrder.user_id).toBe(testUserId);
            expect(savedOrder.cryptocurrency_id).toBe(testCryptoId);
            expect(savedOrder.order_type).toBe('limit');
            expect(parseFloat(savedOrder.price)).toBe(50000.0);

            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                savedOrder.order_id,
            ]);
            expect(dbRes.rows.length).toBe(1);
            expect(dbRes.rows[0].user_id).toBe(testUserId);
        });
    });

    describe('getByOrderId', () => {
        let createdOrder;
        beforeEach(async () => {
            createdOrder = await orderService.save(
                testCryptoId,
                'limit',
                'sell',
                2.0,
                52000.0,
                testUserId
            );
        });

        it('should retrieve an existing order', async () => {
            const foundOrder = await orderService.getByOrderId(testUserId, createdOrder.order_id);
            expect(foundOrder).toBeDefined();
            expect(foundOrder.order_id).toBe(createdOrder.order_id);
            expect(parseFloat(foundOrder.quantity_total)).toBe(2.0);
        });

        it('should return undefined for a non-existent order_id', async () => {
            const foundOrder = await orderService.getByOrderId(testUserId, 99999);
            expect(foundOrder).toBeUndefined();
        });

        it('should return undefined if order belongs to another user', async () => {
            const anotherUserRes = await dbClient.query(
                "INSERT INTO users (email, password_hash, role) VALUES ('user2@test.com', 'hash', 'user') RETURNING user_id"
            );
            const anotherUserId = anotherUserRes.rows[0].user_id;
            const foundOrder = await orderService.getByOrderId(
                anotherUserId,
                createdOrder.order_id
            );
            expect(foundOrder).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('should retrieve all orders for a user', async () => {
            await orderService.save(testCryptoId, 'limit', 'buy', 1.0, 50000, testUserId);
            await orderService.save(testCryptoId, 'market', 'sell', 0.5, null, testUserId); // Market order might have null price

            const orders = await orderService.getAll(testUserId);
            expect(orders).toBeInstanceOf(Array);
            expect(orders.length).toBe(2);
            orders.forEach((order) => expect(order.user_id).toBe(testUserId));
        });

        it('should return an empty array for a user with no orders', async () => {
            const orders = await orderService.getAll(testUserId);
            expect(orders).toEqual([]);
        });
    });

    describe('updateByOrderId', () => {
        let orderToUpdate;
        const initialPrice = 49000.0;
        const initialQuantity = 1.0;

        beforeEach(async () => {
            orderToUpdate = await orderService.save(
                testCryptoId,
                'limit',
                'buy',
                initialQuantity,
                initialPrice,
                testUserId
            );
        });

        it('should update an existing order', async () => {
            const newPrice = 49500.0;
            const newQuantityRemaining = 0.8;
            const newTotalQuantity = 1.2; // Assuming total quantity can also be updated

            const updatedOrder = await orderService.updateByOrderId(
                testCryptoId, // cryptocurrencyid
                'limit', // orderType
                'buy', // orderVariant
                newTotalQuantity, // quantity (total)
                newQuantityRemaining, // quantityRemaining
                newPrice, // price
                testUserId, // userId
                orderToUpdate.order_id // orderId
            );

            expect(updatedOrder).toBeDefined();
            expect(updatedOrder.order_id).toBe(orderToUpdate.order_id);
            expect(parseFloat(updatedOrder.price)).toBe(newPrice);
            expect(parseFloat(updatedOrder.quantity_remaining)).toBe(newQuantityRemaining);
            expect(parseFloat(updatedOrder.quantity_total)).toBe(newTotalQuantity);

            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                orderToUpdate.order_id,
            ]);
            expect(dbRes.rows[0].price).toEqual(newPrice.toString());
            expect(dbRes.rows[0].quantity_remaining).toEqual(newQuantityRemaining.toString());
            expect(dbRes.rows[0].quantity_total).toEqual(newTotalQuantity.toString());
        });

        it('should throw error when trying to update non-existent order', async () => {
            await expect(
                orderService.updateByOrderId(
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
    });

    describe('deleteByOrderId', () => {
        let orderToDelete;
        beforeEach(async () => {
            orderToDelete = await orderService.save(
                testCryptoId,
                'market',
                'sell',
                0.5,
                null,
                testUserId
            );
        });

        it('should delete an existing order', async () => {
            const deletedOrder = await orderService.deleteByOrderId(
                testUserId,
                orderToDelete.order_id
            );
            expect(deletedOrder).toBeDefined();
            expect(deletedOrder.order_id).toBe(orderToDelete.order_id);

            const dbRes = await dbClient.query('SELECT * FROM orders WHERE order_id = $1', [
                orderToDelete.order_id,
            ]);
            expect(dbRes.rows.length).toBe(0);
        });

        it('should return undefined when trying to delete a non-existent order', async () => {
            const result = await orderService.deleteByOrderId(testUserId, 99999);
            expect(result).toBeUndefined();
        });
    });
});

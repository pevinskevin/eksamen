import { ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }

    async delete(userId, orderId) {
        const query = {
            text: 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND id = $3 RETURNING *',
            values: [ORDER_STATUS.CANCELLED, userId, orderId],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async find(userId, orderId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 AND id = $2',
            values: [userId, orderId],
        };
        console.log((await this.db.query(query)).rows.at(0));

        return (await this.db.query(query)).rows.at(0);
    }

    async findAllAscending(userId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at ASC',
            values: [userId],
        };
        return (await this.db.query(query)).rows;
    }

    async findAllOpenBuyOrders(userId) {
        const query = {
            text: `SELECT remaining_quantity, price FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.BUY, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        return (await this.db.query(query)).rows;
    }

    async findAllOpenSellOrders(userId) {
        // Note: Not using ::float casting as it limits precision to 6 decimals
        // Financial calculations require higher precision, so we keep as string
        const query = {
            text: `SELECT SUM(remaining_quantity) FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.SELL, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async save(
        cryptocurrencyId,
        orderType,
        orderVariant,
        initialQuantity,
        price,
        userId,
        notionalValue
    ) {
        // For limit orders: initialQuantity has value, notionalValue is 0
        // For market orders: notionalValue has value, initialQuantity is 0
        const remainingQuantity = initialQuantity; // Will be null for market orders initially

        const query = {
            text: `INSERT INTO orders 
                   (cryptocurrency_id, order_type, order_variant, initial_quantity, remaining_quantity, price, notional_value, user_id) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                   RETURNING *`,
            values: [
                cryptocurrencyId,
                orderType,
                orderVariant,
                initialQuantity, // Can be null for market orders
                remainingQuantity, // Can be null for market orders
                price, // Can be null for market orders
                notionalValue, // Can be null for limit orders
                userId,
            ],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async update(
        userId,
        orderid,
        cryptocurrencyId,
        initialQuantity,
        remainingQuantity,
        price,
        status
    ) {
        // COALESCE ensures only non-null parameters update their respective columns

        const query = {
            text: 'UPDATE orders SET cryptocurrency_id = COALESCE($1, cryptocurrency_id), initial_quantity = COALESCE($2, initial_quantity), remaining_quantity = COALESCE($3, remaining_quantity), price = COALESCE($4, price), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE user_id = $6 AND id = $7 RETURNING *',
            values: [
                cryptocurrencyId,
                initialQuantity,
                remainingQuantity,
                price,
                status,
                userId,
                orderid,
            ],
        };

        return (await this.db.query(query)).rows.at(0);
    }
}

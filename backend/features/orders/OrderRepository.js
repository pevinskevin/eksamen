import { ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }

    async delete(userId, orderId) {
        const query = {
            text: 'DELETE FROM orders WHERE user_id = $1 AND id = $2 RETURNING *',
            values: [userId, orderId],
        };
        const result = (await this.db.query(query)).rows.at(0);
        console.log(result);
        return result;
    }

    async find(userId, orderId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 AND id = $2',
            values: [userId, orderId],
        };
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
            text: `SELECT quantity_remaining, price FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.BUY, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        const result = (await this.db.query(query)).rows;
        console.log(result);

        return result;
    }

    async findAllOpenSellOrders(userId) {
        // I've chosen not to use ::float as it can't return more than 6 decimals.
        const query = {
            text: `SELECT SUM(quantity_remaining) FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.SELL, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        const result = (await this.db.query(query)).rows.at(0);
        console.log(result);
        return result;
    }

    async save(cryptocurrencyId, orderType, orderVariant, quantityTotal, price, userId) {
        const quantityRemaining = quantityTotal;
        const query = {
            text: 'INSERT INTO orders (cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            values: [
                cryptocurrencyId,
                orderType,
                orderVariant,
                quantityTotal,
                quantityRemaining,
                price,
                userId,
            ],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async update(userId, orderid, cryptocurrencyId, quantityTotal, price, status) {
        const quantityRemaining = quantityTotal;
        const query = {
            text: 'UPDATE orders SET cryptocurrency_id = COALESCE($1, cryptocurrency_id), quantity_total = COALESCE($2, quantity_total), quantity_remaining = COALESCE($3, quantity_remaining), price = COALESCE($4, price), status = COALESCE($5, status) WHERE user_id = $6 AND id = $7 RETURNING *',
            values: [
                cryptocurrencyId,
                quantityTotal,
                quantityRemaining,
                price,
                status,
                userId,
                orderid,
            ],
        };
        const result = (await this.db.query(query)).rows.at(0);
        console.log(result);
        return result;
    }
}

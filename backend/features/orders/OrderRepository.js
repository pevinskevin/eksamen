export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }

    async delete(userId, orderId) {
        const query = {
            text: 'DELETE FROM orders WHERE user_id = $1 AND id = $2 RETURNING *',
            values: [userId, orderId],
        };
        const result = await this.db.query(query);
        const resultData = result.rows[0];
        return resultData;
    }

    async find(userId, orderId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 AND id = $2',
            values: [userId, orderId],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async findAll(userId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            values: [userId],
        };
        return (await this.db.query(query)).rows;
    }

    async save(cryptocurrencyId, orderType, orderVariant, quantity, price, userId) {
        const quantityRemaining = quantity;
        const query = {
            text: 'INSERT INTO orders (cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            values: [
                cryptocurrencyId,
                orderType,
                orderVariant,
                quantity,
                quantityRemaining,
                price,
                userId,
            ],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    async update(
        cryptocurrencyId,
        orderType,
        orderVariant,
        quantity,
        quantityRemaining,
        price,
        userId,
        orderid
    ) {
        const query = {
            text: 'UPDATE orders SET cryptocurrency_id = $1, order_type = $2, order_variant = $3, quantity_total = $4, quantity_remaining = $5, price = $6 WHERE user_id = $7 AND id = $8 RETURNING *',
            values: [
                cryptocurrencyId,
                orderType,
                orderVariant,
                quantity,
                quantityRemaining,
                price,
                userId,
                orderid,
            ],
        };
        const result = await this.db.query(query);
        const resultData = result.rows[0];
        return resultData;
    }
}

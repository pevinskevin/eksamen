export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }

    async delete(userId, orderId) {
        const query = {
            text: 'DELETE FROM orders WHERE user_id = $1 AND order_id = $2 RETURNING *',
            values: [userId, orderId],
        };
        const result = await this.db.query(query);
        const resultData = result.rows[0];
        return resultData;
    }

    async find(userId, orderId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 AND order_id = $2',
            values: [userId, orderId],
        };
        const result = await this.db.query(query);
        const resultData = result.rows[0];
        return resultData;
    }

    async findAll(userId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1',
            values: [userId],
        };
        const result = await this.db.query(query);
        const resultData = result.rows;
        if (!resultData) throw new Error('Failed to retrieve orders');
        else return resultData;
    }

    async save(cryptocurrencyid, orderType, orderVariant, quantity, price, userId) {
        const quantityRemaining = quantity;
        const query = {
            text: 'INSERT INTO orders (cryptocurrency_id, order_type, order_variant, quantity_total, quantity_remaining, price, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            values: [
                cryptocurrencyid,
                orderType,
                orderVariant,
                quantity,
                quantityRemaining,
                price,
                userId,
            ],
        };
        const result = await this.db.query(query);
        const resultData = result.rows[0];

       return resultData;
    }

    async update(
        cryptocurrencyid,
        orderType,
        orderVariant,
        quantity,
        quantityRemaining,
        price,
        userId,
        orderid
    ) {
        const query = {
            text: 'UPDATE orders SET cryptocurrency_id = $1, order_type = $2, order_variant = $3, quantity_total = $4, quantity_remaining = $5, price = $6 WHERE user_id = $7 AND order_id = $8 RETURNING *',
            values: [
                cryptocurrencyid,
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

        if (!resultData) throw new Error('Failed to update order.');
        else return resultData;
    }
}

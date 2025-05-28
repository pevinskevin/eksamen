export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }
    async save(cryptocurrencyid, orderType, orderVariant, quantity, price, userid) {
        try {
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
                    userid,
                ],
            };

            const result = await this.db.query(query);

            if (!result.rows || result.rows.length === 0) {
                const error = new Error('Order insertion failed - no rows returned');
                error.code = 'ORDER_INSERT_FAILED';
                error.context = {
                    operation: 'OrderRepository.save',
                    parameters: {
                        cryptocurrencyid,
                        orderType,
                        orderVariant,
                        quantity,
                        price,
                        userid,
                    },
                    query: query.text,
                };
                throw error;
            }

            return result.rows[0];
        } catch (error) {
            // If it's already our custom error, re-throw it
            if (error.code && error.context) {
                throw error;
            }

            // Wrap database errors with context
            const dbError = new Error(`Database error in OrderRepository.save: ${error.message}`);
            dbError.code = 'DATABASE_ERROR';
            dbError.originalError = error;
            dbError.context = {
                operation: 'OrderRepository.save',
                parameters: { cryptocurrencyid, orderType, orderVariant, quantity, price, userid },
                sqlState: error.code,
                constraint: error.constraint,
                detail: error.detail,
            };
            throw dbError;
        }
    }
}

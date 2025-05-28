export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }
    async delete(id) {}

    async find(id) {}

    async findAll() {}

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
            return result.rows[0];
        } catch (error) {
            console.error('❌ ERROR IN OrderRepository.save:', error.message);
            console.error('📍 Parameters:', {
                cryptocurrencyid,
                orderType,
                orderVariant,
                quantity,
                quantityRemaining,
                price,
                userid,
            });
            throw new Error(`OrderRepository.save failed: ${error.message}`);
        }
    }

    async update(id) {}
}

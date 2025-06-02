export default class TradeRepository {
    constructor(db) {
        this.db = db;
    }

    async create(
        orderId,
        cryptocurrencyId,
        orderQuantity,
        executionPrice,
        buyerUserId,
        sellerUserId
    ) {
        const query = {
            text: 'INSERT INTO trades (order_id, cryptocurrency_id, quantity, price, buyer_user_id, seller_user_id, trade_timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            values: [
                orderId,
                cryptocurrencyId,
                orderQuantity,
                executionPrice,
                buyerUserId,
                sellerUserId,
            ],
        };
        return (await this.db.query(query)).rows.at(0);
    }
}

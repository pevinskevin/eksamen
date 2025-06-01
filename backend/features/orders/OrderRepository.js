import { ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
export default class OrderRepository {
    constructor(db) {
        this.db = db;
    }

    /**
     * DELETE ORDER BY USER AND ORDER ID
     *
     * Removes a specific order from the database and returns the deleted record.
     * Uses RETURNING clause to confirm successful deletion.
     *
     * @param {number} userId - ID of the user who owns the order
     * @param {number} orderId - ID of the order to delete
     * @returns {Promise<Object|undefined>} Deleted order object or undefined if not found
     */
    async delete(userId, orderId) {
        const query = {
            text: 'DELETE FROM orders WHERE user_id = $1 AND id = $2 RETURNING *',
            values: [userId, orderId],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    /**
     * FIND ORDER BY USER AND ORDER ID
     *
     * Retrieves a single order for a specific user.
     *
     * @param {number} userId - ID of the user who owns the order
     * @param {number} orderId - ID of the order to find
     * @returns {Promise<Object|undefined>} Order object or undefined if not found
     */
    async find(userId, orderId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 AND id = $2',
            values: [userId, orderId],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    /**
     * FIND ALL ORDERS FOR USER (CHRONOLOGICAL ORDER)
     *
     * Retrieves all orders for a user, sorted by creation time (oldest first).
     * Useful for displaying order history in chronological sequence.
     *
     * @param {number} userId - ID of the user whose orders to retrieve
     * @returns {Promise<Array>} Array of order objects sorted by created_at ASC
     */
    async findAllAscending(userId) {
        const query = {
            text: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at ASC',
            values: [userId],
        };
        return (await this.db.query(query)).rows;
    }

    /**
     * FIND ALL OPEN BUY ORDERS (FOR BALANCE CALCULATION)
     *
     * Retrieves quantity_remaining and price for all open/partially filled buy orders.
     * Used by OrderService to calculate total USD committed to open buy orders
     * for balance validation when placing new buy orders.
     *
     * Returns individual order records (not aggregated) so the service can
     * calculate: sum(quantity_remaining * price) for total USD commitment.
     *
     * @param {number} userId - ID of the user whose buy orders to retrieve
     * @returns {Promise<Array>} Array of objects with {quantity_remaining, price}
     */
    async findAllOpenBuyOrders(userId) {
        const query = {
            text: `SELECT quantity_remaining, price FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.BUY, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        return (await this.db.query(query)).rows;
    }

    /**
     * FIND ALL OPEN SELL ORDERS (AGGREGATED QUANTITY)
     *
     * Returns the SUM of quantity_remaining for all open/partially filled sell orders.
     * Used by OrderService to calculate total crypto committed to open sell orders
     * for balance validation when placing new sell orders.
     *
     * Unlike findAllOpenBuyOrders, this returns aggregated data since we only need
     * the total quantity, not individual price calculations.
     *
     * Note: Avoids ::float casting to preserve decimal precision beyond 6 places.
     * PostgreSQL SUM returns string to maintain precision for financial calculations.
     *
     * @param {number} userId - ID of the user whose sell orders to aggregate
     * @returns {Promise<Object>} Object with {sum: string} - total quantity as string
     */
    async findAllOpenSellOrders(userId) {
        // Note: Not using ::float casting as it limits precision to 6 decimals
        // Financial calculations require higher precision, so we keep as string
        const query = {
            text: `SELECT SUM(quantity_remaining) FROM orders WHERE user_id = $1 AND order_variant = $2 AND (status = $3 OR status = $4)`,
            values: [userId, ORDER_VARIANT.SELL, ORDER_STATUS.OPEN, ORDER_STATUS.PARTIALLY_FILLED],
        };
        return (await this.db.query(query)).rows.at(0);
    }

    /**
     * SAVE NEW ORDER
     *
     * Inserts a new order into the database with initial values.
     * Sets quantity_remaining equal to quantity_total (no fills yet).
     * Database will auto-generate: id, created_at, status (defaults to 'open').
     *
     * @param {number} cryptocurrencyId - ID of the cryptocurrency being traded
     * @param {string} orderType - Type of order (LIMIT, MARKET)
     * @param {string} orderVariant - Order side (BUY, SELL)
     * @param {string} quantityTotal - Total quantity for the order (as string for precision)
     * @param {string} price - Price per unit (as string for precision, may be null for market orders)
     * @param {number} userId - ID of the user placing the order
     * @returns {Promise<Object>} Newly created order object with all fields
     */
    async save(cryptocurrencyId, orderType, orderVariant, quantityTotal, price, userId) {
        // Initially, no part of the order has been filled, so remaining = total
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

    /**
     * UPDATE EXISTING ORDER
     *
     * Updates an existing order with new values. Uses COALESCE to allow partial updates
     * - only provided (non-null) values will be updated, others remain unchanged.
     *
     * When quantity_total is updated, quantity_remaining is set to the same value
     * (assumes order modifications reset the remaining quantity).
     *
     * @param {number} userId - ID of the user who owns the order
     * @param {number} orderid - ID of the order to update
     * @param {number|null} cryptocurrencyId - New cryptocurrency ID (optional)
     * @param {string|null} quantityTotal - New total quantity (optional)
     * @param {string|null} price - New price (optional)
     * @param {string|null} status - New status (optional)
     * @returns {Promise<Object>} Updated order object
     */
    async update(userId, orderid, cryptocurrencyId, quantityTotal, price, status) {
        // If quantity_total is being updated, reset quantity_remaining to match
        // This assumes order modifications reset any partial fills
        const quantityRemaining = quantityTotal;

        // COALESCE ensures only non-null parameters update their respective columns
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
        return (await this.db.query(query)).rows.at(0);
    }
}

/**
 * Business logic validation for orders
 * Only contains rules that OpenAPI cannot enforce -- Claude Sonnet 4 generated.
 */
import * as v from 'valibot';
import { ORDER_TYPE, ORDER_VARIANT, ORDER_STATUS } from './validators.js';
import { CryptocurrencyIdSchema } from './cryptoValidators.js';

// Business rule: Positive integer IDs only
const OrderIdSchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((input) => {
        const num = typeof input === 'string' ? parseInt(input, 10) : input;
        if (isNaN(num)) {
            throw new Error('Order ID must be a valid number');
        }
        return num;
    }),
    v.number(),
    v.integer(),
    v.minValue(1, 'Order ID must be a positive integer (greater than 0)')
);

// Business rule: Order type validation
const OrderTypeSchema = v.pipe(
    v.string('Order type must be a string'),
    v.trim(),
    v.toLowerCase(),
    v.picklist(Object.values(ORDER_TYPE), 'Order type must be either "limit" or "market"')
);

// Business rule: Order variant validation
const OrderVariantSchema = v.pipe(
    v.string('Order variant must be a string'),
    v.trim(),
    v.toLowerCase(),
    v.picklist(Object.values(ORDER_VARIANT), 'Order variant must be either "buy" or "sell"')
);

// Business rule: Quantity validation (minimum trading amount)
const QuantitySchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((input) => {
        const num = typeof input === 'string' ? parseFloat(input) : input;
        if (isNaN(num)) {
            throw new Error('Quantity must be a valid number');
        }
        return num;
    }),
    v.number(),
    v.minValue(0.00000001, 'Quantity must be at least 0.00000001 (minimum trading unit)')
);

// Business rule: Price validation (for limit orders)
const PriceSchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((input) => {
        const num = typeof input === 'string' ? parseFloat(input) : input;
        if (isNaN(num)) {
            throw new Error('Price must be a valid number');
        }
        return num;
    }),
    v.number(),
    v.minValue(0.01, 'Price must be at least 0.01')
);

// Business rule: Optional price for market orders, required for limit orders
const OptionalPriceSchema = v.optional(PriceSchema);

// Business rule: Order status validation
const OrderStatusSchema = v.pipe(
    v.string('Order status must be a string'),
    v.trim(),
    v.toLowerCase(),
    v.picklist(
        Object.values(ORDER_STATUS),
        'Order status must be one of: open, partially_filled, fully_filled, cancelled'
    )
);

// Schema for creating a new order with business logic validation
export const CreateOrderSchema = v.pipe(
    v.object({
        cryptocurrencyId: CryptocurrencyIdSchema,
        orderType: OrderTypeSchema,
        orderVariant: OrderVariantSchema,
        quantityTotal: QuantitySchema,
        price: OptionalPriceSchema,
    }),
    // Business rule: Limit orders must have a price, market orders should not
    v.check((data) => {
        if (data.orderType === 'limit' && (data.price === undefined || data.price === null)) {
            return false;
        }
        if (data.orderType === 'market' && data.price !== undefined && data.price !== null) {
            return false;
        }
        return true;
    }, 'Limit orders must include a price. Market orders should not include a price.')
);

// Schema for updating an order
export const UpdateOrderSchema = v.object({
    quantityTotal: v.optional(QuantitySchema),
    price: v.optional(PriceSchema),
    status: v.optional(OrderStatusSchema),
});

// Schema for validating order ID in routes
export const OrderIdParameterSchema = OrderIdSchema;

// Schema for validating order status transitions
export const OrderStatusTransitionSchema = v.pipe(
    v.object({
        currentStatus: OrderStatusSchema,
        newStatus: OrderStatusSchema,
    }),
    // Business rule: Valid status transitions
    v.check((data) => {
        const { currentStatus, newStatus } = data;

        // Define valid transitions
        const validTransitions = {
            open: ['partially_filled', 'fully_filled', 'cancelled'],
            partially_filled: ['fully_filled', 'cancelled'],
            fully_filled: [], // No transitions allowed from fully filled
            cancelled: [], // No transitions allowed from cancelled
        };

        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }, 'Invalid order status transition. Fully filled and cancelled orders cannot be modified.')
);

// Validation functions
export const validateOrderId = (id) => {
    return v.parse(OrderIdSchema, id);
};

export const validateCreateOrder = (orderData) => {
    return v.parse(CreateOrderSchema, orderData);
};

export const validateUpdateOrder = (orderData) => {
    return v.parse(UpdateOrderSchema, orderData);
};

export const validateOrderStatusTransition = (currentStatus, newStatus) => {
    return v.parse(OrderStatusTransitionSchema, { currentStatus, newStatus });
};

// Business rule validation for minimum order value (example business rule)
export const validateMinimumOrderValue = (quantity, price, orderType) => {
    if (orderType === 'limit') {
        const orderValue = quantity * price;
        const minimumValue = 1.0; // $1 minimum order value

        if (orderValue < minimumValue) {
            throw new Error(
                `Order value must be at least $${minimumValue}. Current value: $${orderValue.toFixed(
                    2
                )}`
            );
        }
    }
    return true;
};

// Legacy exports for backward compatibility with existing service layer
export const orderSchema = CreateOrderSchema;
export const updateOrderSchema = UpdateOrderSchema;

export default {
    // Main validation functions
    validateOrderId,
    validateCreateOrder,
    validateUpdateOrder,
    validateOrderStatusTransition,
    validateMinimumOrderValue,

    // Schema exports
    CreateOrderSchema,
    UpdateOrderSchema,
    OrderIdParameterSchema,
    OrderStatusTransitionSchema,

    // Legacy exports
    orderSchema,
    updateOrderSchema,
};

/**
 * Business logic validation for orders
 * Only contains rules that OpenAPI cannot enforce -- Claude Sonnet 4 generated.
 */
import * as v from 'valibot';
import { ORDER_TYPE, ORDER_VARIANT, ORDER_STATUS } from '../../shared/validators/validators.js';
import { CryptocurrencyIdSchema } from '../cryptocurrencies/cryptoValidators.js';

// console.log('--- DEBUG: TYPE OF IMPORTED DECIMAL ---', typeof Decimal, Decimal);

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

// Business rule: Quantity validation (0 or greater)
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
    v.minValue(0, 'Quantity must be 0 or greater')
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

// Business rule: Notional value validation (0 or greater)
const NotionalValueSchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((input) => {
        const num = typeof input === 'string' ? parseFloat(input) : input;
        if (isNaN(num)) {
            throw new Error('Notional value must be a valid number');
        }
        return num;
    }),
    v.number(),
    v.minValue(0, 'Notional value must be 0 or greater')
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

// Schema for creating a limit order - requires quantity and price, no notional value
const CreateLimitOrderSchema = v.object({
    cryptocurrencyId: CryptocurrencyIdSchema,
    orderVariant: OrderVariantSchema,
    initialQuantity: QuantitySchema,
    price: PriceSchema,
});

// Schema for creating a market order - requires both quantity and notional value
const CreateMarketOrderSchema = v.object({
    cryptocurrencyId: CryptocurrencyIdSchema,
    orderVariant: OrderVariantSchema,
    initialQuantity: QuantitySchema,
    notionalValue: NotionalValueSchema,
});

// Legacy schema for creating a new order with business logic validation (kept for backward compatibility)
const CreateOrderSchema = v.pipe(
    v.object({
        cryptocurrencyId: CryptocurrencyIdSchema,
        orderType: OrderTypeSchema,
        orderVariant: OrderVariantSchema,
        quantityTotal: QuantitySchema,
        price: OptionalPriceSchema,
    }),
    // Business rule: Limit and market orders must have a price, 0 is OK.
    v.check((data) => {
        if (data.orderType === 'limit' && (data.price === undefined || data.price === null)) {
            return false;
        }
        if (data.orderType === 'market' && data.price == undefined && data.price == null) {
            return false;
        }
        return true;
    }, 'Limit and market orders must include a price.')
);

// Schema for updating an order (only limit orders can be updated)
const UpdateLimitOrderSchema = v.object({
    initialQuantity: v.optional(QuantitySchema),
    price: v.optional(PriceSchema),
    status: v.optional(OrderStatusSchema),
});

// Schema for validating order status transitions
const OrderStatusTransitionSchema = v.pipe(
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

// Schema for validating minimum limit order value
const MinimumLimitOrderValueSchema = v.pipe(
    v.object({
        initialQuantity: v.union([v.string(), v.number()]),
        price: v.union([v.string(), v.number()]),
    }),
    v.check(
        (input) => {
            const numQuantity = parseFloat(input.initialQuantity);
            const numPrice = parseFloat(input.price);

            if (isNaN(numQuantity) || isNaN(numPrice)) {
                return false;
            }

            const orderValue = numQuantity * numPrice;
            const minimumValue = 1.0;
            return orderValue >= minimumValue;
        },
        (input) => {
            // The error callback receives a context object. The original data is in `input.input`.
            const originalInput = input.input;
            const numQuantity = parseFloat(originalInput.initialQuantity);
            const numPrice = parseFloat(originalInput.price);
            const orderValue = isNaN(numQuantity) || isNaN(numPrice) ? NaN : numQuantity * numPrice;

            if (isNaN(orderValue)) {
                return 'Invalid quantity or price values';
            }

            const minimumValue = 1.0;
            return `Order value must be at least $${minimumValue}. Current value: $${orderValue.toFixed(
                8
            )}`;
        }
    )
);

// Schema for validating minimum market order value
const MinimumMarketOrderValueSchema = v.pipe(
    v.object({
        orderVariant: OrderVariantSchema,
        initialQuantity: QuantitySchema,
        notionalValue: NotionalValueSchema,
    }),
    v.check(
        (order) => {
            const { orderVariant, initialQuantity, notionalValue } = order;
            const minimumValue = 1.0;

            if (orderVariant === ORDER_VARIANT.BUY) {
                // For buy orders, validate notionalValue (initialQuantity should be 0)
                return notionalValue >= minimumValue;
            } else if (orderVariant === ORDER_VARIANT.SELL) {
                // For sell orders, we can't validate value without current price
                // Just ensure initialQuantity is positive (actual USD value validation happens elsewhere)
                return initialQuantity > 0;
            }
            return false;
        },
        (order) => {
            // Valibot passes error object, actual input is in order.input
            const input = order.input || order;
            const orderVariant = input.orderVariant;
            const initialQuantity = input.initialQuantity || 0;
            const notionalValue = input.notionalValue || 0;
            const minimumValue = 1.0;

            // Check for buy order
            if (orderVariant === ORDER_VARIANT.BUY || orderVariant === 'buy') {
                return `Market buy order notional value must be at least $${minimumValue}. Current value: $${Number(
                    notionalValue
                ).toFixed(2)}`;
            } else if (orderVariant === ORDER_VARIANT.SELL || orderVariant === 'sell') {
                return `Market sell order quantity must be greater than 0. Current quantity: ${Number(
                    initialQuantity
                ).toFixed(8)}`;
            }
            return 'Invalid market order variant';
        }
    )
);

// Validation functions
export const validateOrderId = (id) => {
    return v.parse(OrderIdSchema, id);
};

export const validateCreateLimitOrder = (orderData) => {
    return v.parse(CreateLimitOrderSchema, orderData);
};

export const validateCreateMarketOrder = (orderData) => {
    return v.parse(CreateMarketOrderSchema, orderData);
};

export const validateCreateOrder = (orderData) => {
    return v.parse(CreateOrderSchema, orderData);
};

export const validateUpdateLimitOrder = (orderData) => {
    return v.parse(UpdateLimitOrderSchema, orderData);
};

export const validateOrderStatusTransition = (currentStatus, newStatus) => {
    return v.parse(OrderStatusTransitionSchema, { currentStatus, newStatus });
};

export const validateMinimumLimitOrderValue = (order) => {
    // Extract only the relevant fields to pass to the strict schema.
    const dataToValidate = {
        initialQuantity: order.initialQuantity,
        price: order.price,
    };

    // Pass the clean, minimal object to the parser.
    v.parse(MinimumLimitOrderValueSchema, dataToValidate);

    // If it passes, return nothing.
};

export const validateMinimumMarketOrderValue = (order) => {
    return v.parse(MinimumMarketOrderValueSchema, order);
};

export default {
    // Main validation functions
    validateOrderId,
    validateCreateLimitOrder,
    validateCreateMarketOrder,
    validateCreateOrder,
    validateUpdateLimitOrder,
    validateOrderStatusTransition,
    validateMinimumLimitOrderValue,
    validateMinimumMarketOrderValue,
};

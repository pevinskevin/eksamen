/**
 * Transforms balance values from database numeric types to string format
 * for OpenAPI compliance. This ensures financial precision is maintained
 * while meeting schema requirements. Claude-4-Sonnet Generated.
 *
 * @param {any} obj - Object or array containing balance properties to transform
 * @returns {any} Transformed object with balance values as strings
 */
export function transformBalanceToString(obj) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => transformBalanceToString(item));
    }

    if (typeof obj === 'object') {
        const transformed = { ...obj };

        // Transform balance field if it exists
        if (transformed.balance !== undefined && transformed.balance !== null) {
            transformed.balance = String(transformed.balance);
        }

        // Handle nested objects recursively if needed
        for (const key in transformed) {
            if (typeof transformed[key] === 'object' && transformed[key] !== null) {
                transformed[key] = transformBalanceToString(transformed[key]);
            }
        }

        return transformed;
    }

    return obj;
}

/**
 * Transforms specific financial fields to strings for OpenAPI compliance
 * Useful when you need to transform multiple financial fields at once
 *
 * @param {Object} obj - Object containing financial fields
 * @param {string[]} fields - Array of field names to transform to strings
 * @returns {Object} Object with specified fields converted to strings
 */
export function transformFinancialFields(
    obj,
    fields = [
        'balance',
        'price',
        'amount',
        'quantity',
        'initialQuantity',
        'remainingQuantity',
        'notionalValue',
    ]
) {
    if (!obj || typeof obj !== 'object') return obj;

    const transformed = { ...obj };

    fields.forEach((field) => {
        if (transformed[field] !== undefined && transformed[field] !== null) {
            transformed[field] = String(transformed[field]);
        }
    });

    return transformed;
}

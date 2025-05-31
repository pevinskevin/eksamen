/**
 * Business logic validation for cryptocurrencies
 * Only contains rules that OpenAPI cannot enforce
 */
import * as v from 'valibot';

// Business rule: Symbol format (3-5 uppercase letters only)
const CryptoSymbolSchema = v.pipe(
    v.string(),
    v.trim(),
    v.toUpperCase(),
    v.regex(
        /^[A-Z]{3,5}$/,
        'Symbol must be 3-5 uppercase letters only (no numbers or special characters)'
    )
);

// Business rule: Positive integer IDs only
const CryptoIdSchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((input) => {
        const num = typeof input === 'string' ? parseInt(input, 10) : input;
        if (isNaN(num)) {
            throw new Error('ID must be a valid number');
        }
        return num;
    }),
    v.number(),
    v.integer(),
    v.minValue(1, 'ID must be a positive integer (greater than 0)')
);

// Crypto Name validation
const CryptoNameSchema = v.pipe(
    v.string('Name must be a string'),
    v.trim(),
    v.minLength(1, 'Name cannot be empty'),
    v.maxLength(100, 'Name cannot exceed 100 characters')
);

// Optional Description validation
const CryptoDescriptionSchema = v.optional(
    v.pipe(
        v.string('Description must be a string'),
        v.trim(),
        v.maxLength(500, 'Description cannot exceed 500 characters')
    )
);

// Optional Icon URL validation
const CryptoIconUrlSchema = v.optional(
    v.pipe(
        v.string('Icon URL must be a string'),
        v.trim(),
        v.url('Icon URL must be a valid URL'),
        v.maxLength(255, 'Icon URL cannot exceed 255 characters')
    )
);

// Schema for creating a new cryptocurrency
export const CreateCryptocurrencySchema = v.object({
    symbol: CryptoSymbolSchema,
    name: CryptoNameSchema,
    description: CryptoDescriptionSchema,
    iconUrl: CryptoIconUrlSchema,
});

// Schema for updating a cryptocurrency (all fields optional except constraints)
export const UpdateCryptocurrencySchema = v.object({
    symbol: v.optional(CryptoSymbolSchema),
    name: v.optional(CryptoNameSchema),
    description: CryptoDescriptionSchema,
    iconUrl: CryptoIconUrlSchema,
});

// Schema for validating cryptocurrency ID in routes
export const CryptocurrencyIdSchema = CryptoIdSchema;

// Validation functions
export const validateCryptoSymbol = (symbol) => {
    return v.parse(CryptoSymbolSchema, symbol);
};

export const validateCryptoId = (id) => {
    return v.parse(CryptoIdSchema, id);
};

export default validateCryptoSymbol;

/**
 * Simple cryptocurrency symbol validation
 * Ensures symbols contain only uppercase letters (no numbers or special characters)
 */
import * as v from 'valibot';

const CryptoSymbolSchema = v.pipe(
    v.string('Symbol must be a string'),
    v.trim(),
    v.toUpperCase(),
    v.regex(
        /^[A-Z]{3,5}$/,
        'Symbol must be 3-5 uppercase letters only (no numbers or special characters)'
    )
);

export const validateCryptoSymbol = (symbol) => {
    return v.parse(CryptoSymbolSchema, symbol);
};

export default validateCryptoSymbol;

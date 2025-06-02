import { object, number, string, enum_ } from 'valibot';

export const USER_ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
    SYSTEM: 'system',
});

export const ORDER_TYPE = Object.freeze({
    LIMIT: 'limit',
    MARKET: 'market'
});

export const ORDER_VARIANT = Object.freeze({
    BUY: 'buy',
    SELL: 'sell'
});

export const ORDER_STATUS = Object.freeze({
    OPEN: 'open',
    PARTIALLY_FILLED: 'partially_filled',
    FULLY_FILLED: 'fully_filled',
    CANCELLED: 'cancelled'
});

export const TRANSACTION_TYPE = Object.freeze({
    DEPOSIT_FIAT: 'deposit_fiat',
    WITHDRAWAL_FIAT: 'withdrawal_fiat',
    DEPOSIT_CRYPTO: 'deposit_crypto',
    WITHDRAWAL_CRYPTO: 'withdrawal_crypto'
});

export const TRANSACTION_STATUS = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed'
});

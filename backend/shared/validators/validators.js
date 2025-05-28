import { object, number, string, enum_ } from 'valibot';

export const userRoles = ['user', 'admin'];

export const orderType = ['limit', 'market'];
export const orderVariant = ['buy', 'sell'];
export const orderStatus = ['open', 'partially_filled', 'fully_filled', 'cancelled'];

export const transactionType = [
    'deposit_fiat',
    'withdrawal_fiat',
    'deposit_crypto',
    'withdrawal_crypto',
];
export const transactionStatus = ['pending', 'completed', 'failed'];

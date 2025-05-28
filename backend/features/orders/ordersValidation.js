import { object, number, enum_, minValue, optional, pipe } from 'valibot';
import { orderType, orderVariant } from '../../shared/validators/validators.js';

export const orderSchema = object({
    cryptocurrencyid: pipe(number(), minValue(1, 'Must be positive')),
    orderType: enum_(orderType, 'Must be market or limit'),
    orderVariant: enum_(orderVariant, 'Must be buy or sell'),
    quantity: pipe(number(), minValue(0.01, 'must be positive')),
    price: optional(pipe(number(), minValue(1, 'must be positive'))), // price optional if market order
});

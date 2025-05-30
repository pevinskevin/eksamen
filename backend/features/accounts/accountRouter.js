import { Router } from 'express';
const router = Router();

import { accountService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';
import {
    sendSuccess,
    sendError,
    sendCreated,
    sendNotFound,
    sendBadRequest,
    sendUnauthorized,
    sendForbidden,
} from '../../shared/utils/responseHelpers.js';

router.get('/balances', isAuthenticated, async (req, res) => {
    try {
        const fiatAccount = await accountService.getFiatAccountByUserID(req.user.id);
        const cryptoHoldings = await accountService.getCryptoHoldingsByUserId(req.user.id);
        const accountObj = { fiatAccount: fiatAccount, cryptoHoldings: cryptoHoldings };
        if (!fiatAccount)
            return sendUnauthorized(res, 'No account found. Invalid ID: ' + req.user.id);
        return sendSuccess(res, accountObj);
    } catch (error) {
        return sendError(res, error, 500);
    }
});

router.get('/crypto/:symbol', isAuthenticated, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    try {
        const holding = await accountService.getCryptoHoldingBySymbolAndUserID(req.user.id, symbol);
        return sendSuccess(res, holding);
    } catch (error) {
        sendError(res, error, 500)
    }
});

export default router;

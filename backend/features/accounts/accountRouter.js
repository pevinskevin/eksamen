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
    let fiatBalance;
    let cryptoBalances;
    let accountObj = { fiatBalance, cryptoBalances };
    try {
        fiatBalance = await accountService.getFiatBalanceByUserID(req.user.id);
        if (!fiatBalance) return sendError(res, fiatBalance);
        cryptoBalances = await accountService.getCryptoBalancesByUserId(req.user.id);
        if (!cryptoBalances) return sendError(cryptoBalances);
        else return sendSuccess(res, accountObj);
    } catch (error) {
        return sendError(res, error, 500);
    }
});

router.get('/crypto/:symbol', isAuthenticated, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    try {
        const holding = await accountService.getCryptoBalanceBySymbolAndUserID(req.user.id, symbol);
        if (!holding)
            res.status(404).send({
                errorMessage: 'Cryptocurrency not found. Invalid symbol: ' + symbol,
            });
        else return res.status(200).send({ holding });
    } catch (error) {
        res.status(500).send({ errorMessage: error.message });
    }
});

export default router;

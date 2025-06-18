import { Router } from 'express';
const router = Router();
import { accountService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';
import {
    sendSuccess,
    sendError,
    sendNotFound,
    sendUnauthorized,
    sendUnprocessableEntity,
    sendBadRequest,
    sendPaymentRequired,
    sendInternalServerError,
} from '../../shared/utils/responseHelpers.js';

router.get('/balances', isAuthenticated, async (req, res) => {
    try {
        const fiatAccount = await accountService.getFiatAccountByUserID(req.user.id);
        const cryptoHoldings = await accountService.getCryptoHoldingsByUserId(req.user.id);
        // Combine fiat and crypto balances in single response
        const accountObj = { fiatAccount: fiatAccount, cryptoHoldings: cryptoHoldings };
        if (!fiatAccount)
            return sendUnauthorized(res, 'No account found. Invalid ID: ' + req.user.id);
        return sendSuccess(res, accountObj);
    } catch (error) {
        return sendError(res, error);
    }
});

router.get('/crypto/:symbol', isAuthenticated, async (req, res) => {
    // Normalize symbol to uppercase for database lookup
    const symbol = req.params.symbol.toUpperCase();
    try {
        const holding = await accountService.getCryptoHoldingByUserIdAndSymbol(req.user.id, symbol);
        // Return 404 if user has zero balance (no actual holdings)
        if (holding.balance == 0) return sendNotFound(res, 'Cryptocurrency holding ');
        return sendSuccess(res, holding);
    } catch (error) {
        // Validation errors: invalid symbol format
        if (error.name === 'ValiError') {
            const validationMessage = error.issues.map((issue) => issue.message).join(', ');
            return sendUnprocessableEntity(res, validationMessage);
        }
        // Cryptocurrency doesn't exist in our system
        if (error.message.includes('Invalid symbol: ')) return sendNotFound(res, error.message);
        sendError(res, error, 500);
    }
});

router.post('/deposit/crypto', isAuthenticated, async (req, res) => {
    // currently only supports ETH
    try {
        const deposit = await accountService.cryptoDeposit(req.user.id, req.body.amount);
        return sendSuccess(res, { amount: req.body.amount });
    } catch (error) {
        return sendError(res, error);
    }
});

router.post('/withdrawal/crypto', isAuthenticated, async (req, res) => {
    // currently only supports ETH
    try {
        const withdrawal = await accountService.cryptoWithdrawal(req.user.id, req.body.amount);
        return sendSuccess(res, { amount: req.body.amount });
    } catch (error) {
        if (error.message.includes('Amount exceeds users available balance of: '))
            return sendPaymentRequired(res, error.message);
        else return sendError(res, error);
    }
});

router.post('/deposit/fiat', isAuthenticated, async (req, res) => {
    try {
        const deposit = await accountService.fiatDeposit(req.user.id, req.body.amount);
        return sendSuccess(res, deposit);
    } catch (error) {
        return sendError(res, error);
    }
});

router.post('/withdrawal/fiat', isAuthenticated, async (req, res) => {
    try {
        const withdrawal = await accountService.fiatWithdrawal(req.user.id, req.body.amount);
        return sendSuccess(res, withdrawal);
    } catch (error) {
        return sendError(res, error);
    }
});

router.put('/', isAuthenticated, async (req, res) => {
    try {
        const updatedAccount = await accountService.updateAccountInformation(req.user.id, req.body);
        return sendSuccess(res, updatedAccount);
    } catch (error) {
        return sendInternalServerError(res, error.message);
    }
});

export default router;

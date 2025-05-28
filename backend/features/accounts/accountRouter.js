import { Router } from 'express';
const router = Router();

import { accountService } from '../../shared/factory/factory.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';

router.get('/balances', isAuthenticated, async (req, res) => {
    let fiatBalance;
    let cryptoBalances;
    try {
        fiatBalance = await accountService.getFiatBalanceByUserID(req.user.id);
        if (!fiatBalance)
            return res.status(404).send({
                error: '404 something',
                erorrMessage: 'Account not found. Invalid ID: ' + req.user.id,
            });
    } catch (error) {
        res.status(500).send({ errorMessage: error.message });
    }
    try {
        cryptoBalances = await accountService.getCryptoBalancesByUserId(req.user.id);
        if (!cryptoBalances)
            return res.status(404).send({
                error: '404 something',
                erorrMessage: 'Account not found. Invalid ID: ' + req.user.id,
            });
    } catch (error) {
        res.status(500).send({ errorMessage: error.message });
    }
    res.status(200).send({
        account: fiatBalance,
        holdings: cryptoBalances,
    });
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

import { Router } from 'express';
const router = Router();

import { accountService } from '../../shared/factory/factory';

router.get('/balances', isAuthenticated, async (req, res) => {
    try {
        const fiatBalance = await accountService.getFiatBalance(req.user.id);
        const cryptoBalance = await accountService.getCryptoBalance(req.user.id);
        res.send({
            message: 'Yay it worked - yummy data coming your way!! ٩(＾◡＾)۶ ',
            data: { account: fiatBalance, holdings: cryptoBalance },
        });
    } catch (error) {
        if (
            error.message === 'No Fiat Account registered to user.' ||
            error.message === 'No crypto account registered to user.'
        )
            res.status(404).send({ error: error.message });
        else res.status(500).send({ errorMessage: 'Server error while fetching balances.' });
    }
});

router.get('/crypto/:symbol', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const symbol = req.params.symbol.toUpperCase();

        const specificHolding = await accountService.getCryptoHoldingBySymbol(userId, symbol);

        res.send({
            message: 'Yay it worked - yummy data coming your way!! ٩(＾◡＾)۶ ',
            data: specificHolding,
        });
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('No holdings found')) {
            res.status(404).send({ message: error.message });
        } else {
            res.status(500).send({
                errorMessage: 'Server error while fetching cryptocurrency holding.',
            });
        }
    }
});
export default router;

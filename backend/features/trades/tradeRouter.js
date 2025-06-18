import { Router } from 'express';
const router = Router();
import { tradeService } from '../../shared/factory/factory.js';
import { sendError, sendSuccess } from '../../shared/utils/responseHelpers.js';
import isAuthenticated from '../../shared/middleware/authorisation.js';

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const trades = await tradeService.getTradesByUserId(req.user.id);
        return sendSuccess(res, trades);
    } catch (error) {
        return sendError(res, error);
    }
});

export default router;

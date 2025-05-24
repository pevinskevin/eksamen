import { Router } from 'express';
const router = Router();
import db from '../database/connection.js';
import isAuthenticated from '../middleware/authorisation.js';

router.get('/account/balances', isAuthenticated, (req, res) => {});

export default router;

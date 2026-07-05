import { Router } from 'express';
import { handleRunCode } from '../controllers/code.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { executionRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/run', authMiddleware, executionRateLimit, handleRunCode);

export default router;

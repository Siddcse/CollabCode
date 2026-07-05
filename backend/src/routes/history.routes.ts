import { Router } from 'express';
import { handleGetHistory, handleSaveVersion, handleRestoreVersion } from '../controllers/history.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:room', authMiddleware, handleGetHistory);
router.post('/save', authMiddleware, handleSaveVersion);
router.post('/restore/:versionId', authMiddleware, handleRestoreVersion);

export default router;

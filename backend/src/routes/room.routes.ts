import { Router } from 'express';
import { handleCreateRoom, handleJoinRoom, handleGetRoom } from '../controllers/room.controller';
import { apiRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/create', apiRateLimit, handleCreateRoom);
router.post('/join', apiRateLimit, handleJoinRoom);
router.get('/:id', handleGetRoom);

export default router;

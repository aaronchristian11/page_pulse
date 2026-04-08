import { Router } from 'express';
import {
    sendRecommendation,
    getInbox,
    getUnreadCount,
    markAsRead
} from '../controllers/index.ts';

const router = Router();

router.post('/', sendRecommendation);
router.get('/inbox', getInbox);
router.get('/inbox/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);

export default router;
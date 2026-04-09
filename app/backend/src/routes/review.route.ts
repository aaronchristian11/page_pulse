import { Router } from 'express';
import {
    upsertReview,
    getBookReviews,
    deleteReview,
    getUserReviews,
} from '../controllers/index.ts';

const router = Router();

router.post('/', upsertReview);
router.get('/book/:book_key', getBookReviews);
router.get('/user/:userId', getUserReviews);
router.delete('/:reviewId', deleteReview);

export default router;
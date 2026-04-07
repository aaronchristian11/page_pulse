import { Router } from 'express';
import {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowedUserShelf,
    getFriendRecommendations,
} from '../controllers/index.ts';

const router = Router();

router.post('/follow/:userId', followUser);
router.delete('/unfollow/:userId', unfollowUser);
router.get('/following', getFollowing);
router.get('/followers', getFollowers);
router.get('/friend-recommendations', getFriendRecommendations);
router.get('/:userId/shelf', getFollowedUserShelf);

export default router;
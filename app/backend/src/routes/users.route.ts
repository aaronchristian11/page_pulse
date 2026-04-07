import { Router } from 'express';
import {
    lookupUser,
    userProfile
} from '../controllers/index.ts';

const router = Router();

router.get('/lookup', lookupUser);
router.get('/profile', userProfile);

export default router;
import { Router } from 'express';
import authRoutes from './auth.route';
// import shelfRoutes from './shelf.route';
// import groupRoutes from './group.route';

const router = Router();

router.use('/auth', authRoutes);
// router.use('/shelves', shelfRoutes);
// router.use('/groups', groupRoutes);

export default router;
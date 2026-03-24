import { Router } from 'express';
import authRoutes from './auth.route.ts';
import shelfRoutes from './shelf.route.ts';
import groupRoutes from './group.route.ts';
import openLibraryRoutes from './open_library.route.ts';
import usersRouter from './users.route.ts';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shelves', isAuthenticated, hasPermission('manage shelf'), shelfRoutes);
router.use('/groups', groupRoutes);
router.use('/books', openLibraryRoutes);
router.use('/users', usersRouter);

export default router;
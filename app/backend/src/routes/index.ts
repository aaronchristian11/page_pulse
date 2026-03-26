import { Router } from 'express';
import authRoutes from './auth.route.js';
import shelfRoutes from './shelf.route.js';
import groupRoutes from './group.route.js';
import openLibraryRoutes from './open_library.route.js';
import usersRouter from './users.route.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shelves', isAuthenticated, hasPermission('manage shelf'), shelfRoutes);
router.use('/groups', groupRoutes);
router.use('/books', openLibraryRoutes);
router.use('/users', usersRouter);

export default router;
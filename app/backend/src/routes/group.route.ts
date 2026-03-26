import { Router } from 'express';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, getGroupMembers, updateMember, removeMember, getGroupBooks, addGroupBook, updateGroupBook, deleteGroupBook } from '../controllers/index.js';
import {hasGroupPermission, isAuthenticated, isGroupAdmin} from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/', getGroups);
router.get('/:id', getGroup);

router.post('/', isAuthenticated, createGroup);

router.put('/:groupId', isAuthenticated, hasGroupPermission('Manage groups'), updateGroup);
router.delete('/:groupId', isAuthenticated, hasGroupPermission('Manage groups'), isGroupAdmin, deleteGroup);
router.post('/:groupId/join', isAuthenticated, joinGroup);
router.get('/:groupId/members', isAuthenticated, getGroupMembers);
router.put('/:groupId/members/:userId', isAuthenticated, isGroupAdmin, updateMember);
router.delete('/:groupId/members/:userId', isAuthenticated, isGroupAdmin, removeMember);
router.get('/:groupId/books', isAuthenticated, getGroupBooks);
router.post('/:groupId/books', isAuthenticated, addGroupBook);
router.put('/:groupId/books/:bookId', isAuthenticated, updateGroupBook);
router.delete('/:groupId/books/:bookId', isAuthenticated, deleteGroupBook);

export default router;
import { Router } from 'express';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, getGroupMembers, updateMember, removeMember, getGroupBooks, addGroupBook, updateGroupBook, deleteGroupBook } from '../controllers/index.ts';
import {hasGroupPermission, isAuthenticated, isGroupAdmin} from "../middlewares/auth.middleware.ts";

const router = Router();

router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/', isAuthenticated, hasGroupPermission, createGroup);
router.put('/:id', isAuthenticated, hasGroupPermission, updateGroup);
router.delete('/:id', isAuthenticated, hasGroupPermission, isGroupAdmin, deleteGroup);
router.post('/:groupId/join', isAuthenticated, joinGroup);
router.get('/:groupId/members', isAuthenticated, hasGroupPermission, getGroupMembers);
router.put('/:groupId/members/:userId', isAuthenticated, hasGroupPermission, isGroupAdmin, updateMember);
router.delete('/:groupId/members/:userId', isAuthenticated, hasGroupPermission, isGroupAdmin, removeMember);
router.get('/:groupId/books', isAuthenticated, hasGroupPermission, getGroupBooks);
router.post('/:groupId/books', isAuthenticated, hasGroupPermission, addGroupBook);
router.put('/:groupId/books/:bookId', isAuthenticated, hasGroupPermission, updateGroupBook);
router.delete('/:groupId/books/:bookId', isAuthenticated, hasGroupPermission, deleteGroupBook);

export default router;
import { Router } from 'express';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, getGroupMembers, updateMember, removeMember, getGroupBooks, addGroupBook, updateGroupBook, deleteGroupBook } from '../controllers/index.ts';
import {isGroupAdmin} from "../middlewares/auth.middleware.ts";

const router = Router();

router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/create', createGroup);
router.put('/:id', updateGroup);
router.delete('/:group_id', isGroupAdmin, deleteGroup);
router.post('/:group_id/join', joinGroup);
router.get('/:group_id/members', getGroupMembers);
router.put('/:group_id/members/:user_id', isGroupAdmin, updateMember);
router.delete('/:group_id/members/:user_id', isGroupAdmin, removeMember);
router.get('/:group_id/books', getGroupBooks);
router.post('/:group_id/books', addGroupBook);
router.put('/:group_id/books/:book_id', updateGroupBook);
router.delete('/:group_id/books/:book_id', deleteGroupBook);

export default router;
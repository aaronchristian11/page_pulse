import { Router } from 'express';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, getGroupMembers, updateMember, removeMember, getGroupBooks, addGroupBook, updateGroupBook, deleteGroupBook } from '../controllers';

const router = Router();

router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:groupId/join', joinGroup);
router.get('/:groupId/members', getGroupMembers);
router.put('/:groupId/members/:userId', updateMember);
router.delete('/:groupId/members/:userId', removeMember);
router.get('/:groupId/books', getGroupBooks);
router.post('/:groupId/books', addGroupBook);
router.put('/:groupId/books/:bookId', updateGroupBook);
router.delete('/:groupId/books/:bookId', deleteGroupBook);

export default router;
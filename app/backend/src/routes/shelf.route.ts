import { Router } from 'express';
import { getShelves, createShelf, renameShelf, deleteShelf, getShelfBooks, addBookToShelf, removeBookFromShelf } from '../controllers';

const router = Router();

router.get('/user/:userId', getShelves);
router.post('/', createShelf);
router.put('/:id', renameShelf);
router.delete('/:id', deleteShelf);
router.get('/:shelfId/books', getShelfBooks);
router.post('/:shelfId/books', addBookToShelf);
router.delete('/:shelfId/books/:bookId', removeBookFromShelf);

export default router;
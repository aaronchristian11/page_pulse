import { Router } from 'express';
import { getShelfBooks, addBookToShelf, removeBookFromShelf } from '../controllers/index.ts';

const router = Router();

router.get('/:userId/books', getShelfBooks);
router.post('/book', addBookToShelf);
router.delete('/book', removeBookFromShelf);

export default router;
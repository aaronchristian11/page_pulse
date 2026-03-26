import { Router } from 'express';
import { getShelfBooks, addBookToShelf, removeBookFromShelf } from '../controllers/index.js';

const router = Router();

router.get('/:userId/books', getShelfBooks);
router.post('/:userId/book', addBookToShelf);
router.delete('/:userId/book', removeBookFromShelf);

export default router;
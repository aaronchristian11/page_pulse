import { Router } from 'express';
import {
    getShelfBooks,
    addBookToShelf,
    removeBookFromShelf,
    rateBook,
    setReadingStatus,
} from '../controllers/shelf.controller.ts';

const router = Router();

router.get('/:userId/books', getShelfBooks);
router.post('/:userId/book', addBookToShelf);
router.delete('/:userId/book', removeBookFromShelf);
router.patch('/:userId/book/rating', rateBook);
router.patch('/:userId/book/status', setReadingStatus);

export default router;

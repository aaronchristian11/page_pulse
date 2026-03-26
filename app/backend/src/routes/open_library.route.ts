import { Router } from 'express';
import { searchBooks, getWork, getAuthor, getSubject, getCover } from '../controllers/open_library.controller.js';

const router = Router();

router.get('/search', searchBooks);
router.get('/works/:workId', getWork);
router.get('/authors/:authorId', getAuthor);
router.get('/subjects/:subject', getSubject);
router.get('/covers/:type/:idAndSize', getCover);

export default router;
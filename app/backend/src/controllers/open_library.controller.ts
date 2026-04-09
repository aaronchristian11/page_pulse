import type { Request, Response } from 'express';
import { openLibraryApi } from '../api/open_library.api.ts';
import { bookCache } from '../cache/book.cache.ts';

export const searchBooks = async (req: Request, res: Response) => {
    try {
        if (!req.query.q) {
            const randomSubjects = ['fiction', 'fantasy', 'mystery', 'science', 'history'];
            const subject = randomSubjects[Math.floor(Math.random() * randomSubjects.length)];

            const data = await bookCache.getOrFetchSubject(subject, 12, () =>
                openLibraryApi.getSubject(subject)
            );

            return res.json({
                numFound: data.works.length,
                start: 0,
                docs: data.works.map((work: any) => ({
                    key: work.key,
                    title: work.title,
                    author_name: work.authors?.map((a: any) => a.name),
                    cover_i: work.cover_id,
                    first_publish_year: work.first_publish_year,
                })),
            });
        }

        const data = await bookCache.getOrFetchSearch(
            req.query as Record<string, any>,
            () => openLibraryApi.search(req.query as Record<string, any>)
        );

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to search books.' });
    }
};

export const getWork = async (req: Request, res: Response) => {
    try {
        const data = await bookCache.getOrFetch(req.params.workId, () =>
            openLibraryApi.getWork(req.params.workId)
        );
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch work.' });
    }
};

export const getAuthor = async (req: Request, res: Response) => {
    try {
        // Authors are stable data — cache them too
        const cacheKey = `author:${req.params.authorId}`;
        let data = bookCache.get(cacheKey);
        if (!data) {
            data = await openLibraryApi.getAuthor(req.params.authorId);
            bookCache.set(cacheKey, data);
        }
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch author.' });
    }
};

export const getSubject = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 12;
        const data = await bookCache.getOrFetchSubject(req.params.subject, limit, () =>
            openLibraryApi.getSubject(req.params.subject, limit)
        );
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch subject.' });
    }
};

export const getCover = async (req: Request, res: Response) => {
    try {
        const { type, idAndSize } = req.params;
        const response = await openLibraryApi.getCover(type, idAndSize);

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        response.data.pipe(res);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch cover.' });
    }
};
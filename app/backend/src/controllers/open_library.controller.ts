import type { Request, Response } from 'express';
import { openLibraryApi } from '../api/open_library.api.ts';

export const searchBooks = async (req: Request, res: Response) => {
    try {
        if (!req.query.q) {
            const randomSubjects = ['fiction', 'fantasy', 'mystery', 'science', 'history'];
            const subject = randomSubjects[Math.floor(Math.random() * randomSubjects.length)];
            const data = await openLibraryApi.getSubject(subject);
            return res.json({
                numFound: data.works.length,
                start: 0,
                docs: data.works.map((work: any) => ({
                    key: work.key,
                    title: work.title,
                    author_name: work.authors?.map((a: any) => a.name),
                    cover_i: work.cover_id,
                    first_publish_year: work.first_publish_year,
                }))
            });
        }

        const data = await openLibraryApi.search(req.query as Record<string, any>);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to search books.' });
    }
};

export const getWork = async (req: Request, res: Response) => {
    try {
        const data = await openLibraryApi.getWork(req.params.workId);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch work.' });
    }
};

export const getAuthor = async (req: Request, res: Response) => {
    try {
        const data = await openLibraryApi.getAuthor(req.params.authorId);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch author.' });
    }
};

export const getSubject = async (req: Request, res: Response) => {
    try {
        const data = await openLibraryApi.getSubject(req.params.subject, Number(req.query.limit) || 12);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch subject.' });
    }
};

export const getCover = async (req: Request, res: Response) => {
    try {
        const { type, idAndSize } = req.params;
        const response = await openLibraryApi.getCover(type, idAndSize);
        response.data.pipe(res);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch cover.' });
    }
};
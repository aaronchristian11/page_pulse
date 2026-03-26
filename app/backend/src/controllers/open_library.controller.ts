import type { Request, Response } from 'express';
import { openLibraryApi } from '../api/open_library.api.js';
// Update the normalize helper to handle ParsedQs:
import type { ParsedQs } from 'qs';

function normalize(param: string | string[] | ParsedQs | ParsedQs[] | undefined): string {
    if (Array.isArray(param)) return typeof param[0] === 'string' ? param[0] : "";
    if (typeof param === 'object' && param !== null) return "";
    return param ?? "";
}

export const searchBooks = async (req: Request, res: Response) => {
    try {
        if (!req.query.q) {
            const randomSubjects = ['fiction', 'fantasy', 'mystery', 'science', 'history'];
            const subject = randomSubjects[Math.floor(Math.random() * randomSubjects.length)];
            const query: Record<string, string> = {};
            for (const [key, value] of Object.entries(req.query)) {
                query[key] = typeof value === 'string' ? value : Array.isArray(value) ? (value[0] as string) ?? "" : "";            }
            const data = await openLibraryApi.search(query);

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

        // Normalize query values (string | string[] | undefined → string)
        const query: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.query)) {
            query[key] = typeof value === 'string'
                ? value
                : Array.isArray(value) ? (value[0] as string) ?? ""
                    : "";
        }

        const data = await openLibraryApi.search(query);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to search books.' });
    }
};

export const getWork = async (req: Request, res: Response) => {
    try {
        const workId = normalize(req.params.workId);

        const data = await openLibraryApi.getWork(workId);

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch work.' });
    }
};

export const getAuthor = async (req: Request, res: Response) => {
    try {
        const authorId = normalize(req.params.authorId);
        const data = await openLibraryApi.getAuthor(authorId);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch author.' });
    }
};

export const getSubject = async (req: Request, res: Response) => {
    try {
        const subject = normalize(req.params.subject);
        const limit = Number(req.query.limit) || 12;

        const data = await openLibraryApi.getSubject(subject, limit);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch subject.' });
    }
};

export const getCover = async (req: Request, res: Response) => {
    try {
        const type = normalize(req.params.type);
        const idAndSize = normalize(req.params.idAndSize);

        const response = await openLibraryApi.getCover(type, idAndSize);
        response.data.pipe(res);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch cover.' });
    }
};

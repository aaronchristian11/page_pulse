import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve('data/book_cache.json');

type CacheStore = Record<string, any>;

function readCache(): CacheStore {
    try {
        if (!fs.existsSync(CACHE_FILE)) return {};
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function writeCache(cache: CacheStore): void {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Normalize a raw Open Library work object into the shape BookCard expects.
 *
 * Search results already have `cover_i` (a single number).
 * Work detail responses (/works/:id) instead have `covers: number[]`.
 * We flatten `covers[0]` → `cover_i` so every cached entry is consistent.
 */
export function normalizeWork(work: any): any {
    if (!work) return work;
    const cover_i = work.cover_i ?? work.covers?.[0] ?? null;
    return { ...work, cover_i };
}

export const bookCache = {
    get(key: string): any | null {
        const cache = readCache();
        const entry = cache[key] ?? null;
        // Backfill cover_i for entries written before normalization was added
        if (entry && key.startsWith('work:') && entry.cover_i == null && entry.covers?.length) {
            const fixed = normalizeWork(entry);
            this.set(key, fixed);
            return fixed;
        }
        return entry;
    },

    set(key: string, value: any): void {
        const cache = readCache();
        cache[key] = value;
        writeCache(cache);
    },

    has(key: string): boolean {
        const cache = readCache();
        return key in cache;
    },

    /**
     * Retrieve a cached work by its Open Library key.
     * If missing, calls `fetcher()`, normalizes the result, stores and returns it.
     */
    async getOrFetch(workKey: string, fetcher: () => Promise<any>): Promise<any> {
        const cacheKey = `work:${workKey}`;
        if (this.has(cacheKey)) {
            return this.get(cacheKey);
        }
        const raw = await fetcher();
        const data = normalizeWork(raw);
        this.set(cacheKey, data);
        return data;
    },

    /**
     * Retrieve a cached search result.
     * Cache key is built from the query string so each unique search is stored separately.
     */
    async getOrFetchSearch(queryParams: Record<string, any>, fetcher: () => Promise<any>): Promise<any> {
        const cacheKey = `search:${JSON.stringify(queryParams)}`;
        if (this.has(cacheKey)) {
            return this.get(cacheKey);
        }
        const data = await fetcher();
        this.set(cacheKey, data);
        return data;
    },

    /**
     * Retrieve a cached subject result.
     */
    async getOrFetchSubject(subject: string, limit: number, fetcher: () => Promise<any>): Promise<any> {
        const cacheKey = `subject:${subject}:${limit}`;
        if (this.has(cacheKey)) {
            return this.get(cacheKey);
        }
        const data = await fetcher();
        this.set(cacheKey, data);
        return data;
    },
};
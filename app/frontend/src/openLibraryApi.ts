//Keeping this file for API reference

const BASE_URL = '/api/books'
const COVERS_URL = '/api/books/covers'

export interface BookSearchResult {
    key: string
    title: string
    author_name?: string[]
    first_publish_year?: number
    cover_i?: number
    subject?: string[]
    edition_count?: number
    language?: string[]
    ia?: string[]
    ebook_access?: string
    isbn?: string[]
}

export interface SearchResponse {
    numFound: number
    start: number
    docs: BookSearchResult[]
}

export interface WorkDetail {
    key: string
    title: string
    description?: string | { value: string }
    subjects?: string[]
    covers?: number[]
    authors?: { author: { key: string } }[]
    first_publish_date?: string
}

export interface AuthorDetail {
    key: string
    name: string
    bio?: string | { value: string }
    birth_date?: string
    death_date?: string
    photos?: number[]
}

export type SearchField = 'q' | 'title' | 'author' | 'subject' | 'isbn'

export interface SearchOptions {
    field?: SearchField
    page?: number
    limit?: number
}

const headers = {
    'User-Agent': 'PagePulse/1.0 (dev@pagepulse.app)',
}

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin)
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`OpenLibrary API error: ${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
}

export const openLibraryApi = {
    /**
     * Full-text search across books, authors, subjects.
     */
    search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        const {field = 'q', page = 1, limit = 20} = options
        return apiFetch<SearchResponse>('/search', {
            [field]: query,
            page,
            limit,
            fields: 'key,title,author_name,first_publish_year,cover_i,subject,edition_count,language,ia,ebook_access,isbn',
        })
    },

    /**
     * Get full work details by Open Library work ID (e.g. "OL45804W").
     */
    getWork(workId: string): Promise<WorkDetail> {
        return apiFetch<WorkDetail>(`/works/${workId}`)
    },

    /**
     * Get author details by Open Library author ID (e.g. "OL1394244A").
     */
    getAuthor(authorId: string): Promise<AuthorDetail> {
        return apiFetch<AuthorDetail>(`/authors/${authorId}`)
    },

    /**
     * Get books by subject slug (e.g. "science_fiction").
     */
    getSubject(subject: string, limit = 12): Promise<{ works: BookSearchResult[] }> {
        return apiFetch(`/subjects/${encodeURIComponent(subject)}`, {limit})
    },

    /**
     * Cover image URL helpers.
     */
    covers: {
        byId(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
            return `${COVERS_URL}/B/${coverId}-${size}.jpg`
        },
        byIsbn(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
            return `${COVERS_URL}/isbn/${isbn}-${size}.jpg`
        },
        placeholder(): string {
            return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192"%3E%3Crect width="128" height="192" fill="%23e2e8f0"/%3E%3Ctext x="64" y="100" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle"%3ENo Cover%3C/text%3E%3C/svg%3E'
        },
    },
}

export function toBook(doc: BookSearchResult) {
    return {
        id: doc.key.replace('/works/', ''),
        isbn: doc.isbn?.[0] ?? null,
        title: doc.title,
        description: null as string | null,
    }
}

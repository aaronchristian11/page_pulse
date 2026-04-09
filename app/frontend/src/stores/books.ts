import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import {openLibraryApi} from '@/openLibraryApi'
import type {BookSearchResult} from '@/openLibraryApi'
import {useAuthStore} from "@/stores/auth";
import router from "@/router";
import axios from "axios";

export interface Book {
    id?: string;
    key: string;
    normalizedKey: string;
    addedBy?: string;
    addedByUserId?: number;
    title?: string;
    author?: string;
    cover_i?: number;
    first_publish_year?: number;
    [key: string]: any;
}

export const normalizeKey = (key: string) => key.replace('/works/', '')

export function toBook(b: BookSearchResult): Book {
    return {
        id: String(b.id),
        key: b.key,
        normalizedKey: normalizeKey(b.key),
        addedBy: `${b.first_name} ${b.last_name}` ?? 'N/A',
        addedByUserId: b.user_id ?? 'N/A',
        title: b.title,
        author: b.author ?? 'N/A',
        cover_i: b.cover_i,
        first_publish_year: b.first_publish_year ?? undefined,
        ...b
    }
}

export const useBooksStore = defineStore('books', () => {
    const authStore = useAuthStore();
    const user = computed(() => authStore.user);
    const books = ref<Book[]>([])
    const searchQuery = ref('')
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const totalResults = ref(0)
    const currentPage = ref(1)
    const pageSize = 24

    const shelf = ref<Book[] | null>([])
    const selectedBook = ref<Book | null>(null)
    const selectedWorkDetail = ref<any | null>(null)
    const isLoadingDetail = ref(false)

    const setShelf = (userBooks: Book[]|null) => {
        shelf.value = userBooks;
    };

    async function searchBooks(query: string, page = 1) {
        isLoading.value = true;
        error.value = null;
        searchQuery.value = query;
        currentPage.value = page;

        await openLibraryApi.search(query, {
            page,
            limit: pageSize
        }).then(response => {
            books.value = response.docs.map(toBook);
            totalResults.value = response.numFound || response.works.length;
        }).catch(err => {
            error.value = 'Failed to fetch books. Please try again.';
            books.value = [];
        }).finally(() => isLoading.value = false);
    }

    async function fetchWorkDetail(key: string) {
        isLoadingDetail.value = true
        selectedWorkDetail.value = null
        try {
            const data = await openLibraryApi.getWork(key)
            selectedWorkDetail.value = {
                description: typeof data.description === 'string' ? data.description : data.description?.value ?? null,
                subjects: data.subjects?.slice(0, 10) ?? [],
                first_publish_date: data.first_publish_date ?? null,
            }
        } catch {
            selectedWorkDetail.value = null
        } finally {
            isLoadingDetail.value = false
        }
    }

    function selectBook(book: Book) {
        selectedBook.value = book
        fetchWorkDetail(book.normalizedKey)
    }

    function clearSelectedBook() {
        selectedBook.value = null
        selectedWorkDetail.value = null
    }

    async function addToShelf(book: Book) {
        if (!user.value) {
            router.push('login');
        } else {
            if (shelf.value && !shelf.value.find(b => b.id === book.id)) {
                await axios.post(`/api/shelves/${user.value.id}/book`, {
                    book_key: book.normalizedKey
                }).then(() => {
                    shelf.value.push(book);
                }).catch(err => {
                    error.value = err.response?.data?.error || 'Failed to add book to shelf.';
                });
            }
        }
    }

    async function removeFromShelf(bookId: string) {
        if (!user.value) {
            router.push('login');
        } else {
            await axios.delete(`/api/shelves/${user.value.id}/book`, {
                data: {
                    book_key: shelf.value.find(b => b.id === bookId)?.normalizedKey
                }
            }).then(() => {
                shelf.value = shelf.value.filter(b => b.id !== bookId);
            }).catch(err => {
                error.value = err.response?.data?.error || 'Failed to remove book from shelf.';
            });
        }
    }

    async function fetchShelf() {
        if (!user.value) {
            router.push('login');
        } else {
            await axios.get(`/api/shelves/${user.value.id}/books`)
                .then(res => shelf.value = res.data.books.map(toBook))
                .catch(err => {
                    error.value = err.response?.data?.error || 'Failed to fetch shelf.';
                });
        }
    }

    function isOnShelf(bookId: string): boolean {
        return shelf.value && shelf.value.some(b => b.id === bookId)
    }

    function coverUrl(coverId: number | null, size: 'S' | 'M' | 'L' = 'M'): string {
        return coverId ? openLibraryApi.covers.byId(coverId, size) : openLibraryApi.covers.placeholder()
    }

    async function setReadingStatus(bookKey: string, status: string) {
        if (!user.value) return;
        await axios.patch(`/api/shelves/${user.value.id}/book/status`, {
            book_key: bookKey,
            status,
        }).then(() => {
            if (shelf.value) {
                const target = shelf.value.find(b => b.normalizedKey === bookKey);
                if (target) target.reading_status = status;
            }
        }).catch(err => {
            error.value = err.response?.data?.error || 'Failed to save reading status.';
        });
    }

    async function rateBook(bookKey: string, rating: number) {
        if (!user.value) return;

        await axios.patch(`/api/shelves/${user.value.id}/book/rating`, {
            book_key: bookKey,
            rating,
        }).then(() => {
            if (shelf.value) {
                const target = shelf.value.find(b => b.normalizedKey === bookKey);
                if (target) target.rating = rating;
            }
        }).catch(err => {
            error.value = err.response?.data?.error || 'Failed to save rating.';
        });
    }

    return {
        books, searchQuery, isLoading, error, totalResults, currentPage, pageSize,
        shelf, selectedBook, selectedWorkDetail, isLoadingDetail,
        searchBooks, selectBook, clearSelectedBook,
        addToShelf, removeFromShelf, isOnShelf, coverUrl, fetchShelf, setShelf,
        rateBook, setReadingStatus
    }
})

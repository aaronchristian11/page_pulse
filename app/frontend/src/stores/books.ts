import { ref } from 'vue'
import { defineStore } from 'pinia'
import { openLibraryApi } from '@/openLibraryApi'
import type { BookSearchResult } from '@/openLibraryApi'

export interface Book {
  id: string
  isbn: string | null
  title: string
  description: string | null
  author: string | null
  cover_i: number | null
  first_publish_year: number | null
  subject: string[]
}

function toBook(doc: BookSearchResult): Book {
  return {
    id: doc.key.replace('/works/', ''),
    isbn: doc.isbn?.[0] ?? null,
    title: doc.title ?? 'Unknown Title',
    description: null,
    author: doc.author_name?.[0] ?? null,
    cover_i: doc.cover_i ?? null,
    first_publish_year: doc.first_publish_year ?? null,
    subject: doc.subject?.slice(0, 5) ?? [],
  }
}

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([])
  const searchQuery = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalResults = ref(0)
  const currentPage = ref(1)
  const pageSize = 24

  const shelf = ref<Book[]>([])
  const selectedBook = ref<Book | null>(null)
  const selectedWorkDetail = ref<any | null>(null)
  const isLoadingDetail = ref(false)

  async function searchBooks(query: string, page = 1) {
    if (!query.trim()) return
    isLoading.value = true
    error.value = null
    searchQuery.value = query
    currentPage.value = page
    try {
      const response = await openLibraryApi.search(query, { page, limit: pageSize })
      books.value = response.docs.map(toBook)
      totalResults.value = response.numFound
    } catch {
      error.value = 'Failed to fetch books. Please try again.'
      books.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchWorkDetail(bookId: string) {
    isLoadingDetail.value = true
    selectedWorkDetail.value = null
    try {
      const data = await openLibraryApi.getWork(bookId)
      selectedWorkDetail.value = {
        description: typeof data.description === 'string'
          ? data.description
          : data.description?.value ?? null,
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
    fetchWorkDetail(book.id)
  }

  function clearSelectedBook() {
    selectedBook.value = null
    selectedWorkDetail.value = null
  }

  function addToShelf(book: Book) {
    if (!shelf.value.find(b => b.id === book.id)) {
      shelf.value.push(book)
    }
  }

  function removeFromShelf(bookId: string) {
    shelf.value = shelf.value.filter(b => b.id !== bookId)
  }

  function isOnShelf(bookId: string): boolean {
    return shelf.value.some(b => b.id === bookId)
  }

  function coverUrl(coverId: number | null, size: 'S' | 'M' | 'L' = 'M'): string {
    return coverId ? openLibraryApi.covers.byId(coverId, size) : openLibraryApi.covers.placeholder()
  }

  return {
    books, searchQuery, isLoading, error, totalResults, currentPage, pageSize,
    shelf, selectedBook, selectedWorkDetail, isLoadingDetail,
    searchBooks, selectBook, clearSelectedBook,
    addToShelf, removeFromShelf, isOnShelf, coverUrl,
  }
})

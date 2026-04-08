<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useBooksStore} from '@/stores/books';
import { useGroupShelvesStore } from '@/stores/groupShelves';
import Search from '@/components/Search.vue';
import BookCard from '@/components/BookCard.vue';
import BookDetail from '@/components/BookDetail.vue';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import type {Book} from '@/stores/books';

const store = useBooksStore()
const groups = useGroupShelvesStore()
const router = useRouter()

const genres = [
    { label: 'Academic & Scholarly',  query: 'academic',               icon: 'pi pi-graduation-cap' },
    { label: 'Action & Adventure',    query: 'action adventure',       icon: 'pi pi-bolt' },
    { label: 'All-Time Classics',     query: 'classic',                icon: 'pi pi-star' },
    { label: 'Comedy & Humour',       query: 'comedy',                 icon: 'pi pi-face-smile' },
    { label: 'For Children',          query: 'Children\'s fiction',    icon: 'pi pi-heart' },
    { label: 'History & Documentary', query: 'history',                icon: 'pi pi-book' },
    { label: 'Horror & Thriller',     query: 'horror',                 icon: 'pi pi-eye' },
    { label: 'Romance & Fantasy',     query: 'romance',                icon: 'pi pi-sparkles' },
]

function openDetail(book: Book) {
    store.selectBook(book);
}

onMounted(() => {
    store.searchBooks('');
});
</script>

<template>
    <main class="flex flex-col gap-6 p-6">

        <!-- Page Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex flex-col gap-1">
              <h1 class="text-3xl font-bold text-color">Book Catalogue</h1>
              <p class="text-surface-400 text-sm">Search and discover books from the Open Library</p>
          </div>
        </div>

        <!-- Search Bar -->
        <Search/>

        <!-- Genre Tags -->
        <div class="genre-grid">
            <button
                v-for="genre in genres"
                :key="genre.label"
                class="genre-btn"
                :class="{ 'genre-btn--active': store.searchQuery === genre.query }"
                @click="store.searchBooks(genre.query)"
            >
                <i :class="genre.icon"/>
                <span>{{ genre.label }}</span>
            </button>
        </div>

        <!-- Results Count -->
        <p v-if="store.totalResults && !store.isLoading && store.searchQuery !== ''" class="text-sm text-surface-400">
            <span class="font-semibold text-color">{{ store.totalResults.toLocaleString() }}</span>
            results for "{{ store.searchQuery }}"
        </p>

        <!-- Loading State -->
        <div v-if="store.isLoading"
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div
                v-for="n in 20"
                :key="n"
                class="rounded-lg overflow-hidden animate-pulse bg-surface-100 dark:bg-surface-800"
            >
                <div class="aspect-[2/3] bg-surface-200 dark:bg-surface-700"/>
                <div class="p-3 flex flex-col gap-2">
                    <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4"/>
                    <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2"/>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="store.error" class="flex flex-col items-center gap-3 py-20 text-center">
            <i class="pi pi-exclamation-circle text-4xl text-red-400"/>
            <p class="text-color">{{ store.error }}</p>
            <Button label="Try Again" severity="secondary"
                    @click="store.searchBooks(store.searchQuery)"/>
        </div>

        <!-- Empty State -->
        <div v-else-if="!(store.books && store.books.length) && store.searchQuery"
             class="flex flex-col items-center gap-3 py-20 text-center">
            <i class="pi pi-search text-4xl text-surface-400"/>
            <p class="text-color font-semibold">No results found</p>
            <p class="text-surface-400 text-sm">Try a different search term</p>
        </div>

        <!-- Book Grid -->
        <div v-else
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-stretch">
            <BookCard
                v-for="book in store.books"
                :key="book.id"
                :book="book"
                class="h-full"
                @select="openDetail"
            />
        </div>

        <!-- Pagination -->
        <div v-if="!store.isLoading && (store.books && store.books.length)"
             class="flex items-center justify-center gap-4 pt-2">
            <Button
                icon="pi pi-arrow-left"
                label="Previous"
                severity="secondary"
                outlined
                :disabled="store.currentPage <= 1"
                @click="store.searchBooks(store.searchQuery, store.currentPage - 1)"
            />
            <span class="text-sm text-surface-400">Page {{ store.currentPage }}</span>
            <Button
                icon="pi pi-arrow-right"
                icon-pos="right"
                label="Next"
                severity="secondary"
                outlined
                @click="store.searchBooks(store.searchQuery, store.currentPage + 1)"
            />
        </div>
    </main>

    <!-- Book Detail Drawer -->
    <BookDetail/>
</template>

<style scoped>
.genre-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.genre-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    height: 2.5rem;
    width: 100%;
    border-radius: 9999px;
    border: 1px solid var(--p-surface-300, #cbd5e1);
    background: var(--p-surface-0, #ffffff);
    color: var(--p-surface-600, #475569);
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s ease;
}

.genre-btn:hover {
    border-color: var(--p-primary-500, #6366f1);
    color: var(--p-primary-500, #6366f1);
    background: var(--p-primary-50, #eef2ff);
}

.genre-btn--active {
    background: var(--p-primary-500, #6366f1);
    border-color: var(--p-primary-500, #6366f1);
    color: #ffffff;
}

.genre-btn--active:hover {
    background: var(--p-primary-600, #4f46e5);
    border-color: var(--p-primary-600, #4f46e5);
    color: #ffffff;
}

/* Dark mode */
:root[class*="dark"] .genre-btn,
.dark .genre-btn {
    background: var(--p-surface-800, #1e293b);
    border-color: var(--p-surface-600, #475569);
    color: var(--p-surface-300, #cbd5e1);
}

:root[class*="dark"] .genre-btn:hover,
.dark .genre-btn:hover {
    border-color: var(--p-primary-400, #818cf8);
    color: var(--p-primary-400, #818cf8);
    background: var(--p-surface-700, #334155);
}
</style>

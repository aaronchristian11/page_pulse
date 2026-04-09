<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {toBook, useBooksStore} from '@/stores/books';
import { useGroupShelvesStore } from '@/stores/groupShelves';
import Search from '@/components/Search.vue';
import BookCard from '@/components/BookCard.vue';
import BookDetail from '@/components/BookDetail.vue';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import type { Book } from '@/stores/books';

const store = useBooksStore()
const groups = useGroupShelvesStore()
const router = useRouter()

const genres = [
    { label: 'Academic & Scholarly',  query: 'academic',              icon: 'pi pi-graduation-cap' },
    { label: 'Action & Adventure',    query: 'action adventure',      icon: 'pi pi-bolt' },
    { label: 'All-Time Classics',     query: 'classic',               icon: 'pi pi-star' },
    { label: 'Comedy & Humour',       query: 'comedy',                icon: 'pi pi-face-smile' },
    { label: 'For Children',          query: "Children's fiction",    icon: 'pi pi-heart' },
    { label: 'History & Documentary', query: 'history',               icon: 'pi pi-book' },
    { label: 'Horror & Thriller',     query: 'horror',                icon: 'pi pi-eye' },
    { label: 'Romance & Fantasy',     query: 'romance',               icon: 'pi pi-sparkles' },
]

// ── Date filters ─────────────────────────────────────────
interface DateFilter { label: string; key: string; min: number | null; max: number | null }
const dateFilters: DateFilter[] = [
    { label: 'All Years',   key: 'all',       min: null, max: null },
    { label: 'Before 1900', key: 'pre1900',   min: null, max: 1899 },
    { label: '1900–1950',   key: '1900-1950', min: 1900, max: 1950 },
    { label: '1951–1999',   key: '1951-1999', min: 1951, max: 1999 },
    { label: '2000–2009',   key: '2000-2009', min: 2000, max: 2009 },
    { label: '2010–2019',   key: '2010-2019', min: 2010, max: 2019 },
    { label: '2020 onward', key: '2020+',     min: 2020, max: null },
]

// ── Sort options ─────────────────────────────────────────
type SortKey = 'default' | 'az' | 'za'
const sortOptions: { label: string; key: SortKey; icon: string }[] = [
    { label: 'Default', key: 'default', icon: 'pi pi-sort-alt' },
    { label: 'A → Z',   key: 'az',      icon: 'pi pi-sort-alpha-down' },
    { label: 'Z → A',   key: 'za',      icon: 'pi pi-sort-alpha-up-alt' },
]

const activeDateKey = ref<string>('all')
const activeSort = ref<SortKey>('default')

const filteredBooks = computed(() => {
    const filter = dateFilters.find(f => f.key === activeDateKey.value) ?? dateFilters[0]
    let result = store.books ?? []

    if (filter.min !== null || filter.max !== null) {
        result = result.filter(b => {
            const year = b.first_publish_year
            if (!year) return false
            if (filter.min !== null && year < filter.min) return false
            if (filter.max !== null && year > filter.max) return false
            return true
        })
    }

    if (activeSort.value === 'az') {
        result = [...result].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    } else if (activeSort.value === 'za') {
        result = [...result].sort((a, b) => (b.title ?? '').localeCompare(a.title ?? ''))
    }

    return result
})

const hasActiveFilters = computed(() =>
    activeDateKey.value !== 'all' || activeSort.value !== 'default'
)

function clearFilters() {
    activeDateKey.value = 'all'
    activeSort.value = 'default'
}

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

        <!-- Filter & Sort Bar -->
        <div class="filter-bar">
            <div class="filter-bar__group">
                <span class="filter-bar__label"><i class="pi pi-calendar"/> Year</span>
                <div class="filter-bar__pills">
                    <button
                        v-for="df in dateFilters"
                        :key="df.key"
                        class="filter-pill"
                        :class="{ 'filter-pill--active': activeDateKey === df.key }"
                        @click="activeDateKey = df.key"
                    >{{ df.label }}</button>
                </div>
            </div>
            <div class="filter-bar__divider"/>
            <div class="filter-bar__group">
                <span class="filter-bar__label"><i class="pi pi-sort-alt"/> Sort</span>
                <div class="filter-bar__pills">
                    <button
                        v-for="so in sortOptions"
                        :key="so.key"
                        class="filter-pill"
                        :class="{ 'filter-pill--active': activeSort === so.key }"
                        @click="activeSort = so.key"
                    >
                        <i :class="so.icon"/>
                        {{ so.label }}
                    </button>
                </div>
            </div>
            <button v-if="hasActiveFilters" class="filter-bar__clear" @click="clearFilters">
                <i class="pi pi-times"/> Clear
            </button>
        </div>

        <!-- Results Count -->
        <p v-if="store.totalResults && !store.isLoading && store.searchQuery !== ''" class="text-sm text-surface-400">
            <span class="font-semibold text-color">{{ filteredBooks.length.toLocaleString() }}</span>
            <template v-if="hasActiveFilters"> filtered of {{ store.totalResults.toLocaleString() }}</template>
            <template v-else> of {{ store.totalResults.toLocaleString() }}</template>
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

        <!-- Empty State — no API results -->
        <div v-else-if="!(store.books && store.books.length) && store.searchQuery"
             class="flex flex-col items-center gap-3 py-20 text-center">
            <i class="pi pi-search text-4xl text-surface-400"/>
            <p class="text-color font-semibold">No results found</p>
            <p class="text-surface-400 text-sm">Try a different search term</p>
        </div>

        <!-- Empty State — filters removed everything -->
        <div v-else-if="store.books && store.books.length && !filteredBooks.length"
             class="flex flex-col items-center gap-3 py-20 text-center">
            <i class="pi pi-filter-slash text-4xl text-surface-400"/>
            <p class="text-color font-semibold">No books match this filter</p>
            <p class="text-surface-400 text-sm">Try a different date range or clear the filters</p>
            <Button label="Clear Filters" severity="secondary" size="small" @click="clearFilters"/>
        </div>

        <!-- Book Grid -->
        <div v-else
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-stretch">
            <BookCard v-for="book in filteredBooks"
                      :key="book.id"
                      :book="book"
                      class="h-full"
                      @select="openDetail" />
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
/* ── Genre grid ──────────────────────────────────────────── */
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
    border: 1px solid var(--p-text-color);
    background: var(--color-background);
    color: var(--p-text-color);
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s ease;
}

.genre-btn:hover {
    border-color: var(--p-primary-500, #6366f1);
    color: var(--p-button-primary-hover-color);
    background: var(--p-primary-500, #eef2ff);
}

.genre-btn--active {
    background: var(--p-primary-500, #6366f1);
    border-color: var(--p-primary-500, #6366f1);
    color: var(--p-button-primary-hover-color);
}

.genre-btn--active:hover {
    background: var(--p-primary-600, #4f46e5);
    border-color: var(--p-primary-600, #4f46e5);
    color: #ffffff;
}

/* Dark mode genre */
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

/* ── Filter bar ──────────────────────────────────────────── */
.filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    background: var(--color-background);
    border: 1px solid var(--p-text-color, #e2e8f0);
    border-radius: 0.75rem;
}

.filter-bar__group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-bar__label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--p-text-color);
    white-space: nowrap;
}

.filter-bar__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.filter-bar__divider {
    width: 1px;
    height: 1.5rem;
    background: var(--p-text-color);
    flex-shrink: 0;
}

.filter-bar__clear {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: auto;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--p-red-500, #ef4444);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.4rem;
    transition: background 0.15s;
}
.filter-bar__clear:hover {
    background: var(--p-red-50, #fef2f2);
}

/* ── Filter pills ────────────────────────────────────────── */
.filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 500;
    border: 1px solid var(--p-text-color);
    background: var(--color-background);
    color: var(--p-text-color);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}
.filter-pill:hover {
    border-color: var(--p-primary-400, #818cf8);
    color: var(--p-button-primary-hover-color);
    background: var(--p-primary-500, #eef2ff);
}
.filter-pill--active {
    background: var(--p-primary-500, #6366f1);
    border-color: var(--p-primary-500, #6366f1);
    color: var(--p-button-primary-hover-color);
}
.filter-pill--active:hover {
    background: var(--p-primary-600, #4f46e5);
    border-color: var(--p-primary-600, #4f46e5);
}

/* Dark mode filter */
:root[class*="dark"] .filter-bar,
.dark .filter-bar {
    background: var(--p-surface-800, #1e293b);
    border-color: var(--p-surface-700, #334155);
}
:root[class*="dark"] .filter-bar__divider,
.dark .filter-bar__divider {
    background: var(--p-surface-600, #475569);
}
:root[class*="dark"] .filter-pill,
.dark .filter-pill {
    background: var(--p-surface-700, #334155);
    border-color: var(--p-surface-600, #475569);
    color: var(--p-surface-300, #cbd5e1);
}
:root[class*="dark"] .filter-pill:hover,
.dark .filter-pill:hover {
    border-color: var(--p-primary-400, #818cf8);
    color: var(--p-primary-400, #818cf8);
}
</style>

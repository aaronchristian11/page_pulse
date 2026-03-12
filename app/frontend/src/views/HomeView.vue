<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useBooksStore} from '@/stores/books';
import Search from '@/components/Search.vue';
import BookCard from '@/components/BookCard.vue';
import BookDetail from '@/components/BookDetail.vue';
import Button from 'primevue/button';
import type {Book} from '@/stores/books';

const store = useBooksStore()

function openDetail(book: Book) {
    store.selectBook(book);
}

onMounted(() => {
    if (store.books.length === 0) {
        store.searchBooks('');
    }
});
</script>

<template>
    <main class="flex flex-col gap-6 p-6">

        <!-- Page Header -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold text-color">Book Catalogue</h1>
            <p class="text-surface-400 text-sm">Search and discover books from the Open Library</p>
        </div>

        <!-- Search Bar -->
        <Search/>

        <!-- Results Count -->
        <p v-if="store.totalResults && !store.isLoading" class="text-sm text-surface-400">
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
        <div v-else-if="!store.books.length && store.searchQuery"
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
        <div v-if="!store.isLoading && store.books.length"
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


<script setup lang="ts">
    import StarRating from '@/components/StarRating.vue'
    import { onMounted } from 'vue';
    import { useBooksStore } from '@/stores/books';
    import BookCard from '@/components/BookCard.vue';
    import BookDetail from '@/components/BookDetail.vue';
    import Button from 'primevue/button';
    import type { Book } from '@/stores/books';

    const store = useBooksStore()

    function openDetail(book: Book) {
        store.selectBook(book)
    }

    async function handleRating(bookKey: string, rating: number) {
        await store.rateBook(bookKey, rating);
        await store.fetchShelf();
    }

    onMounted(() => {
        store.fetchShelf();
    });
</script>

<template>
    <main class="flex flex-col gap-6 p-6">

        <!-- Header -->
        <div class="flex flex-col gap-1">
            <h1 class="text-3xl font-bold text-color">My Shelf</h1>
            <p class="text-surface-400 text-sm">
                {{ (store.shelf && store.shelf.length) ? store.shelf.length : 0 }}
                book{{ store.shelf && store.shelf.length !== 1 ? 's' : '' }} saved
            </p>
        </div>

        <!-- Loading State -->
        <div v-if="store.isLoading"
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div v-for="n in 12"
                 :key="n"
                 class="rounded-lg overflow-hidden animate-pulse bg-surface-100 dark:bg-surface-800">
                <div class="aspect-[2/3] bg-surface-200 dark:bg-surface-700"/>
                <div class="p-3 flex flex-col gap-2">
                    <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4"/>
                    <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2"/>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="store.shelf && !store.shelf.length"
             class="flex flex-col items-center gap-4 py-20 text-center">
            <i class="pi pi-book text-6xl text-surface-300"/>
            <p class="text-color font-semibold text-lg">Your shelf is empty</p>
            <p class="text-surface-400 text-sm">Go to the Catalogue and add books you want to read</p>
            <RouterLink to="/">
                <Button label="Browse Catalogue" icon="pi pi-search"/>
            </RouterLink>
        </div>

        <!-- Book Grid -->
        <div v-else
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-stretch">
            <div v-for="book in store.shelf"
                 :key="book.id"
                 class="relative group h-full">
                <!-- BookCard (clickable to open details) -->
                <BookCard :book="book"
                          class="h-full"
                          @select="openDetail" />

                <!-- Remove button — top-right, shown on hover -->
                <button class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           bg-surface-900/70 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                        aria-label="Remove from shelf"
                        @click.stop="store.removeFromShelf(book.normalizedKey)">
                    <i class="pi pi-times text-xs"/>
                </button>

                <!-- Star rating -->
                <div class="px-2 pb-2">
                    <div class="bg-surface-900/80 rounded-lg p-1.5 flex justify-center">
                        <StarRating :modelValue="book.rating ?? null"
                                    @update:modelValue="handleRating(book.normalizedKey, $event)" />
                    </div>
                </div>
            </div>
        </div>

    </main>

    <BookDetail/>
</template>

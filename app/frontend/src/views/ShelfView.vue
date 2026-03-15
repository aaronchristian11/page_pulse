<script setup lang="ts">
    import {ref, onMounted} from 'vue';
    import { useBooksStore } from '@/stores/books';
    import BookDetail from '@/components/BookDetail.vue';
    import Button from 'primevue/button';
    import Card from 'primevue/card';
    import type { Book } from '@/stores/books';

    const store = useBooksStore()

    function openDetail(book: Book) {
      store.selectBook(book)
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
        {{ store.shelf ? store.shelf.length : 0 }} book{{ store.shelf && store.shelf.length !== 1 ? 's' : '' }} saved
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="!store.shelf" class="flex flex-col items-center gap-4 py-20 text-center">
      <i class="pi pi-book text-6xl text-surface-300" />
      <p class="text-color font-semibold text-lg">Your shelf is empty</p>
      <p class="text-surface-400 text-sm">Go to the Catalogue and add books you want to read</p>
      <RouterLink to="/">
        <Button label="Browse Catalogue" icon="pi pi-search" />
      </RouterLink>
    </div>

    <!-- Shelf List -->
    <div v-else class="flex flex-col gap-3">
      <Card
        v-for="book in store.shelf"
        :key="book.id"
        class="cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="openDetail(book)"
      >
        <template #content>
          <div class="flex items-center gap-4">

            <!-- Cover thumbnail -->
            <div class="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-surface-100 dark:bg-surface-800">
              <img
                v-if="book.cover_i"
                :src="store.coverUrl(book.cover_i, 'S')"
                :alt="book.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-xl text-surface-400 font-serif">
                {{ book.title.charAt(0) }}
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-color truncate">{{ book.title }}</p>
              <p v-if="book.author" class="text-sm text-primary truncate">{{ book.author }}</p>
              <p v-if="book.isbn" class="text-xs text-surface-400 mt-1">ISBN: {{ book.isbn }}</p>
            </div>

            <!-- Remove -->
            <Button
              icon="pi pi-times"
              severity="secondary"
              text
              rounded
              aria-label="Remove from shelf"
              @click.stop="store.removeFromShelf(book.id)"
            />
          </div>
        </template>
      </Card>
    </div>

  </main>

  <BookDetail />
</template>

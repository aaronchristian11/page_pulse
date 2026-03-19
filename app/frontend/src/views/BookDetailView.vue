<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import axios from 'axios'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'

const route = useRoute()
const router = useRouter()
const store = useBooksStore()

const book = ref<any>(null)
const detail = ref<any>(null)
const isLoading = ref(true)

const bookId = computed(() => route.params.id as string)

onMounted(async () => {
  isLoading.value = true
  try {
    // If navigated from catalogue, book is already in store
    if (store.selectedBook && store.selectedBook.id === bookId.value) {
      book.value = store.selectedBook
    } else {
      // Fetch directly from Open Library
      const res = await axios.get(`https://openlibrary.org/works/${bookId.value}.json`)
      book.value = {
        id: bookId.value,
        title: res.data.title,
        author: null,
        cover_i: res.data.covers?.[0] ?? null,
        isbn: null,
        first_publish_year: null,
        subject: res.data.subjects?.slice(0, 5) ?? [],
      }
    }

    // Fetch full work detail
    const workRes = await axios.get(`https://openlibrary.org/works/${bookId.value}.json`)
    detail.value = {
      description: typeof workRes.data.description === 'string'
        ? workRes.data.description
        : workRes.data.description?.value ?? null,
      subjects: workRes.data.subjects?.slice(0, 12) ?? [],
      first_publish_date: workRes.data.first_publish_date ?? null,
    }
  } catch {
    book.value = null
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="p-6 max-w-4xl mx-auto">

    <!-- Back Button -->
    <Button
      icon="pi pi-arrow-left"
      label="Back to Catalogue"
      severity="secondary"
      text
      class="mb-6"
      @click="router.push('/')"
    />

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Not Found -->
    <div v-else-if="!book" class="flex flex-col items-center gap-4 py-20 text-center">
      <i class="pi pi-exclamation-circle text-4xl text-surface-400" />
      <p class="text-color font-semibold">Book not found</p>
      <Button label="Go Home" @click="router.push('/')" />
    </div>

    <!-- Book Content -->
    <div v-else class="flex flex-col md:flex-row gap-8">

      <!-- Cover -->
      <div class="flex-shrink-0 flex justify-center">
        <div class="w-48 rounded-lg shadow-xl overflow-hidden bg-surface-100 dark:bg-surface-800 aspect-[2/3]">
          <img
            v-if="book.cover_i"
            :src="store.coverUrl(book.cover_i, 'L')"
            :alt="book.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-7xl text-surface-400 font-serif">
            {{ book.title?.charAt(0) }}
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="flex flex-col gap-4 flex-1">
        <h1 class="text-3xl font-bold text-color leading-tight">{{ book.title }}</h1>
        <p v-if="book.author" class="text-primary text-lg font-medium">{{ book.author }}</p>

        <!-- Meta -->
        <div class="flex flex-wrap gap-4 text-sm text-surface-400">
          <span v-if="book.first_publish_year || detail?.first_publish_date">
            <i class="pi pi-calendar mr-1" />
            {{ detail?.first_publish_date || book.first_publish_year }}
          </span>
          <span v-if="book.isbn">
            <i class="pi pi-barcode mr-1" />ISBN: {{ book.isbn }}
          </span>
        </div>

        <Divider />

        <!-- Description -->
        <div>
          <h2 class="font-semibold text-color mb-2">Synopsis</h2>
          <p v-if="detail?.description" class="text-sm text-color-secondary leading-relaxed">
            {{ detail.description }}
          </p>
          <p v-else class="text-sm text-surface-400 italic">No description available.</p>
        </div>

        <!-- Subjects -->
        <div v-if="detail?.subjects?.length">
          <h2 class="font-semibold text-color mb-2">Genres / Subjects</h2>
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="s in detail.subjects"
              :key="s"
              :value="s"
              severity="secondary"
              class="text-xs"
            />
          </div>
        </div>

        <Divider />

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <Button
            :icon="store.isOnShelf(book.id) ? 'pi pi-check' : 'pi pi-plus'"
            :label="store.isOnShelf(book.id) ? 'On My Shelf' : 'Add to Shelf'"
            :severity="store.isOnShelf(book.id) ? 'secondary' : 'primary'"
            @click="store.isOnShelf(book.id) ? store.removeFromShelf(book.id) : store.addToShelf(book)"
          />
          <a :href="`https://openlibrary.org/works/${book.id}`" target="_blank" rel="noopener">
            <Button label="View on Open Library" icon="pi pi-external-link" severity="secondary" outlined />
          </a>
        </div>
      </div>
    </div>
  </main>
</template>

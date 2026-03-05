<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

// --- Book schema ---
interface Book {
  id: string
  isbn: string | null
  title: string
  description: string | null
}

const books = ref<Book[]>([])

// --- Transform raw API doc to Book schema ---
function toBook(doc: any): Book {
  return {
    id: doc.key.replace('/works/', ''),
    isbn: doc.isbn?.[0] ?? null,
    title: doc.title,
    description: null,
  }
}

async function searchBooks() {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: { title: 'dune', limit: 20, fields: 'key,title,isbn' }
  })
  books.value = response.data.docs.map(toBook)
}

searchBooks()
</script>

<template>
  <ul>
    <li v-for="book in books" :key="book.id">
      {{ book.title }}
    </li>
  </ul>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Start with an empty list
const myBooks = ref<any[]>([])

// When the page loads, fetch the books from the backend!
onMounted(async () => {
  const response = await fetch('http://localhost:3000/api/books')
  myBooks.value = await response.json()
})
</script>

<template>
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>📚 My Book Catalog</h1>
    <p>Welcome to my assignment! Here are the current books:</p>
    
    <ul>
      <li v-for="book in myBooks" :key="book.title" style="margin-bottom: 10px;">
        <RouterLink :to="`/book/${book.title}`"><strong>{{ book.title }}</strong></RouterLink> by {{ book.author }} <em>({{ book.genre }})</em>
      </li>
    </ul>
  </div>
</template>
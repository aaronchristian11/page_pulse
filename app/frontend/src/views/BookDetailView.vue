<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// This lets us look at the URL to see which book was clicked
const route = useRoute() 

// We will store the specific book data here once we find it
const book = ref<any>(null)

onMounted(async () => {
  // 1. Fetch all the books from your backend (just like on the Home page)
  const response = await fetch('http://localhost:3000/api/books')
  const allBooks = await response.json()

  // 2. Search through the list to find the one that matches the title in the URL
  book.value = allBooks.find((b: any) => b.title === route.params.title)
})
</script>

<template>
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Book Details</h2>
    
    <div v-if="book">
      <h3>Title: {{ book.title }}</h3>
      <p><strong>Author:</strong> {{ book.author }}</p>
      <p><strong>Genre:</strong> {{ book.genre }}</p>
    </div>

    <div v-else>
      <p>Loading book details...</p>
    </div>
    
    <br>
    <RouterLink to="/">Go Back Home</RouterLink>
  </div>
</template>
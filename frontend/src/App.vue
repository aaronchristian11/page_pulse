<script setup lang="ts">
import { onMounted } from 'vue'
import { openLibraryApi, toBook } from '@/openLibraryApi'

onMounted(async () => {
  // Test search
  const results = await openLibraryApi.search('dune', { field: 'title' })
  const books = results.docs.map(toBook)
  console.log('Search results:', books)

  // Test single work
  const work = await openLibraryApi.getWork('OL45804W')
  console.log('Work detail:', work)
})
</script>

<template>
  <p>Check the browser console for API results.</p>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useBooksStore } from '@/stores/books'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const store = useBooksStore()
const query = ref('')

async function handleSearch() {
  if (!query.value.trim()) return
  await store.searchBooks(query.value)
}
</script>

<template>
  <div class="flex gap-2 w-full">
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        v-model="query"
        placeholder="Search by title, author, genre…"
        class="w-full"
        @keydown.enter="handleSearch"
      />
    </IconField>
    <Button
      label="Search"
      icon="pi pi-search"
      :loading="store.isLoading"
      @click="handleSearch"
    />
  </div>
</template>

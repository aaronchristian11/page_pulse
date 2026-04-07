<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps<{
    isbn: string | null
    title: string
    author?: string | null
}>()

/**
 * Construct purchase links from ISBN (Open Library provides ISBNs).
 * Amazon: https://www.amazon.com/dp/<ISBN13> (works for ISBN-10 too via redirect)
 * Google Books: https://books.google.com/books?vid=ISBN<ISBN>
 * If no ISBN, fall back to title+author search query.
 */
const amazonUrl = computed(() => {
    if (props.isbn) {
        return `https://www.amazon.com/dp/${props.isbn}`
    }
    const q = encodeURIComponent(`${props.title} ${props.author ?? ''}`.trim())
    return `https://www.amazon.com/s?k=${q}&i=stripbooks`
})

const googleBooksUrl = computed(() => {
    if (props.isbn) {
        return `https://books.google.com/books?vid=ISBN${props.isbn}`
    }
    const q = encodeURIComponent(`${props.title} ${props.author ?? ''}`.trim())
    return `https://books.google.com/books?q=${q}`
})

const openLibraryUrl = computed(() => {
    if (props.isbn) {
        return `https://openlibrary.org/isbn/${props.isbn}`
    }
    return null
})
</script>

<template>
    <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Buy This Book</p>

        <div class="flex flex-wrap gap-2">
            <!-- Amazon -->
            <a :href="amazonUrl" target="_blank" rel="noopener noreferrer">
                <Button
                    label="Amazon"
                    icon="pi pi-shopping-cart"
                    size="small"
                    severity="warn"
                    class="text-xs"
                />
            </a>

            <!-- Google Books -->
            <a :href="googleBooksUrl" target="_blank" rel="noopener noreferrer">
                <Button
                    label="Google Books"
                    icon="pi pi-book"
                    size="small"
                    severity="info"
                    class="text-xs"
                />
            </a>

            <!-- Open Library (free / borrow) -->
            <a v-if="openLibraryUrl" :href="openLibraryUrl" target="_blank" rel="noopener noreferrer">
                <Button
                    label="Open Library"
                    icon="pi pi-globe"
                    size="small"
                    severity="secondary"
                    class="text-xs"
                />
            </a>
        </div>

        <p v-if="isbn" class="text-xs text-surface-400">
            ISBN: <span class="font-mono">{{ isbn }}</span>
        </p>
        <p v-else class="text-xs text-surface-400 italic">
            No ISBN available — showing search results
        </p>
    </div>
</template>

<script setup lang="ts">
import type {Book} from '@/stores/books'
import {useBooksStore} from '@/stores/books'
import Card from 'primevue/card'
import Button from 'primevue/button'

const props = defineProps<{ book: Book }>()
const emit = defineEmits<{ select: [book: Book] }>()
const store = useBooksStore()
</script>

<template>
    <Card class="book-card cursor-pointer hover:shadow-lg transition-shadow duration-200"
          @click="emit('select', book)">
        <template #header>
            <div class="relative aspect-[2/3] overflow-hidden bg-surface-100 dark:bg-surface-800">
                <img v-if="book.cover_i"
                     :src="store.coverUrl(book.cover_i, 'M')"
                     :alt="book.title"
                     loading="lazy"
                     class="w-full h-full object-cover" />
                <div v-else
                     class="w-full h-full flex items-center justify-center text-5xl text-surface-400 font-serif">
                    {{ book.title.charAt(0) }}
                </div>
            </div>
        </template>

        <template #content>
            <div class="flex flex-col gap-1 px-1">
                <p class="font-semibold text-sm leading-tight line-clamp-2 text-color">
                    {{ book.title }}
                </p>
                <p v-if="book.author" class="text-xs text-primary truncate">
                    {{ book.author }}
                </p>
                <p v-if="book.first_publish_year" class="text-xs text-surface-400">
                    {{ book.first_publish_year }}
                </p>
            </div>
        </template>

        <template #footer>
            <div class="px-1 pb-1">
                <Button :icon="store.isOnShelf(book.id) ? 'pi pi-check' : 'pi pi-plus'"
                        :label="store.isOnShelf(book.id) ? 'On Shelf' : 'Add'"
                        :severity="store.isOnShelf(book.id) ? 'secondary' : 'primary'"
                        size="small"
                        class="w-full"
                        @click.stop="store.isOnShelf(book.id) ? store.removeFromShelf(book.id) : store.addToShelf(book)" />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.book-card {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.book-card :deep(.p-card-body) {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.book-card :deep(.p-card-content) {
    flex: 1;
}

.book-card :deep(.p-card-footer) {
    margin-top: auto;
}
</style>

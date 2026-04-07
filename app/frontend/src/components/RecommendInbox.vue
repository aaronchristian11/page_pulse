<script setup lang="ts">
import { onMounted } from 'vue'
import { useRecommendationsStore } from '@/stores/recommendations'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import Button from 'primevue/button'
import Badge from 'primevue/badge'

const recStore = useRecommendationsStore()
const authStore = useAuthStore()
const booksStore = useBooksStore()

onMounted(async () => {
    if (authStore.user) {
        await recStore.loadInbox()
    }
})

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function coverUrl(bookKey: string) {
    // Try to get cover from the books store cache; fall back to placeholder
    const workId = bookKey.replace('/works/', '')
    const cached = booksStore.books.find((b) => b.id === workId)
    return cached ? booksStore.coverUrl(cached.cover_i, 'S') : booksStore.coverUrl(null, 'S')
}

async function handleRead(id: number) {
    await recStore.markAsRead(id)
}

function bookOpenLibraryUrl(bookKey: string) {
    const workId = bookKey.startsWith('/works/') ? bookKey : `/works/${bookKey}`
    return `https://openlibrary.org${workId}`
}
</script>

<template>
    <div class="flex flex-col gap-6 p-6 max-w-2xl mx-auto">

        <!-- Header -->
        <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-color">Inbox</h1>
            <Badge
                v-if="recStore.unreadCount > 0"
                :value="String(recStore.unreadCount)"
                severity="danger"
            />
        </div>

        <p class="text-sm text-surface-400 -mt-4">Book recommendations from friends and groups</p>

        <!-- Loading -->
        <div v-if="recStore.isLoading" class="flex justify-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl text-primary" />
        </div>

        <!-- Empty -->
        <div
            v-else-if="!recStore.inbox.length"
            class="flex flex-col items-center gap-3 py-20 text-center"
        >
            <i class="pi pi-inbox text-5xl text-surface-300" />
            <p class="font-semibold text-color">Your inbox is empty</p>
            <p class="text-sm text-surface-400">
                Follow friends and join groups to get book recommendations here.
            </p>
        </div>

        <!-- Inbox items -->
        <div v-else class="flex flex-col gap-3">
            <div
                v-for="item in recStore.inbox"
                :key="item.id"
                :class="[
                    'rounded-xl border p-4 flex gap-4 transition-colors',
                    item.is_read
                        ? 'border-surface-100 dark:border-surface-700 bg-transparent'
                        : 'border-primary/30 bg-primary/5 dark:bg-primary/10',
                ]"
            >
                <!-- Unread dot -->
                <div class="flex-shrink-0 mt-1.5">
                    <span
                        v-if="!item.is_read"
                        class="block w-2.5 h-2.5 rounded-full bg-primary"
                    />
                    <span v-else class="block w-2.5 h-2.5" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-color">
                            <span class="text-primary">@{{ item.sender_username }}</span>
                            recommended a book
                            <span v-if="item.group_id" class="text-surface-400">(group)</span>
                        </p>
                        <span class="text-xs text-surface-400 flex-shrink-0">
                            {{ formatDate(item.created_at) }}
                        </span>
                    </div>

                    <!-- Book link -->
                    <a
                        :href="bookOpenLibraryUrl(item.book_key)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 mt-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        <i class="pi pi-book text-xs" />
                        {{ item.book_key }}
                    </a>

                    <p
                        v-if="item.message"
                        class="mt-2 text-sm text-surface-600 dark:text-surface-300 italic bg-surface-50 dark:bg-surface-800 rounded px-3 py-2"
                    >
                        "{{ item.message }}"
                    </p>
                </div>

                <!-- Mark read -->
                <div class="flex-shrink-0">
                    <Button
                        v-if="!item.is_read"
                        icon="pi pi-check"
                        size="small"
                        text
                        rounded
                        severity="secondary"
                        aria-label="Mark as read"
                        @click="handleRead(item.id)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

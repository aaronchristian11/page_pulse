<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import StarRating from '@/components/StarRating.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import axios from 'axios'

const router = useRouter()
const auth = useAuthStore()
const books = useBooksStore()

const profile = ref<any>(null)
const isLoading = ref(true)

const initials = computed(() => {
    if (!profile.value) return '?'
    return `${profile.value.first_name?.[0] ?? ''}${profile.value.last_name?.[0] ?? ''}`.toUpperCase()
})

const memberSince = computed(() => {
    if (!profile.value?.created_at) return ''
    return new Date(profile.value.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long'
    })
})

onMounted(async () => {
    if (!auth.user) {
        router.push('/login')
        return
    }
    try {
        const [profileRes] = await Promise.all([
            axios.get(`/api/users/${auth.user.id}/profile`),
            books.fetchShelf(),
        ])
        profile.value = profileRes.data.user
    } catch {
        profile.value = null
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <main class="p-6 max-w-3xl mx-auto flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl text-primary" />
        </div>

        <template v-else-if="profile">

            <!-- Profile Header -->
            <Card>
                <template #content>
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {{ initials }}
                        </div>
                        <div class="flex flex-col gap-1 flex-1">
                            <h1 class="text-2xl font-bold text-color">{{ profile.first_name }} {{ profile.last_name }}</h1>
                            <p class="text-surface-400 text-sm">@{{ profile.username }}</p>
                            <p class="text-surface-400 text-xs">{{ profile.email }}</p>
                        </div>
                        <div class="text-right hidden sm:block">
                            <p class="text-xs text-surface-400">Member since</p>
                            <p class="text-sm font-medium text-color">{{ memberSince }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Stats Row -->
            <div class="grid grid-cols-2 gap-4">
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.shelf_count }}</p>
                        <p class="text-sm text-surface-400 mt-1">Books on Shelf</p>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.rated_count }}</p>
                        <p class="text-sm text-surface-400 mt-1">Books Rated</p>
                    </template>
                </Card>
            </div>

            <Divider />

            <!-- Shelf with Ratings -->
            <div>
                <h2 class="text-lg font-semibold text-color mb-3">My Shelf</h2>

                <div v-if="!books.shelf?.length" class="flex flex-col items-center gap-3 py-10 text-center">
                    <i class="pi pi-book text-5xl text-surface-300" />
                    <p class="text-surface-400 text-sm">No books on your shelf yet.</p>
                    <RouterLink to="/">
                        <Button label="Browse Catalogue" icon="pi pi-search" size="small" />
                    </RouterLink>
                </div>

                <div v-else class="flex flex-col gap-3">
                    <Card v-for="book in books.shelf"
                          :key="book.id"
                          class="cursor-pointer hover:shadow-md transition-shadow"
                          @click="router.push(`/book/${book.id}`)" >
                        <template #content>
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-surface-100 dark:bg-surface-800">
                                    <img
                                        v-if="book.cover_i"
                                        :src="books.coverUrl(book.cover_i, 'S')"
                                        :alt="book.title"
                                        class="w-full h-full object-cover"
                                    />
                                    <div v-else class="w-full h-full flex items-center justify-center text-surface-400 font-serif">
                                        {{ book.title.charAt(0) }}
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-semibold text-color truncate text-sm">{{ book.title }}</p>
                                    <p v-if="book.author" class="text-xs text-primary truncate">{{ book.author }}</p>
                                </div>
                                <StarRating :modelValue="book.rating ?? null" :readonly="true" />
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

        </template>

        <!-- Error state -->
        <div v-else class="flex flex-col items-center gap-4 py-20 text-center">
            <i class="pi pi-exclamation-circle text-4xl text-surface-400" />
            <p class="text-color font-semibold">Could not load profile.</p>
            <Button label="Go Home" @click="router.push('/')" />
        </div>

    </main>
</template>

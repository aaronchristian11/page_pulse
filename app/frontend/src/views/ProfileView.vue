<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Card from 'primevue/card'
import axios from 'axios'

const router = useRouter()
const auth = useAuthStore()

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
        const { data } = await axios.get('/api/users/profile')
        profile.value = data.user
    } catch {
        profile.value = null
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <main class="p-6 max-w-2xl mx-auto flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl text-primary" />
        </div>

        <template v-else-if="profile">

            <!-- Identity card -->
            <Card>
                <template #content>
                    <div class="flex items-center gap-5">
                        <!-- Avatar -->
                        <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {{ initials }}
                        </div>

                        <!-- Name / username / email -->
                        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                            <h1 class="text-2xl font-bold text-color">
                                {{ profile.first_name }} {{ profile.last_name }}
                            </h1>
                            <p class="text-sm text-surface-400">@{{ profile.username }}</p>
                            <p class="text-xs text-surface-400">{{ profile.email }}</p>
                        </div>

                        <!-- Member since -->
                        <div class="text-right hidden sm:block flex-shrink-0">
                            <p class="text-xs text-surface-400">Member since</p>
                            <p class="text-sm font-medium text-color">{{ memberSince }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Summary stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.shelf_count }}</p>
                        <p class="text-xs text-surface-400 mt-1">Books on Shelf</p>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.rated_count }}</p>
                        <p class="text-xs text-surface-400 mt-1">Books Rated</p>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.follower_count }}</p>
                        <p class="text-xs text-surface-400 mt-1">Followers</p>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <p class="text-3xl font-bold text-primary">{{ profile.following_count }}</p>
                        <p class="text-xs text-surface-400 mt-1">Following</p>
                    </template>
                </Card>
            </div>

            <!-- Quick links -->
            <div class="flex gap-3 flex-wrap">
                <Button label="My Shelf" icon="pi pi-book" severity="secondary" outlined @click="router.push('/shelf')" />
                <Button label="Friends" icon="pi pi-users" severity="secondary" outlined @click="router.push('/friends')" />
                <Button label="Group Shelves" icon="pi pi-sitemap" severity="secondary" outlined @click="router.push('/groups')" />
            </div>

        </template>

        <!-- Error -->
        <div v-else class="flex flex-col items-center gap-4 py-20 text-center">
            <i class="pi pi-exclamation-circle text-4xl text-surface-400" />
            <p class="text-color font-semibold">Could not load profile.</p>
            <Button label="Go Home" @click="router.push('/')" />
        </div>

    </main>
</template>

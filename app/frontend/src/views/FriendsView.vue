<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useFollowsStore } from '@/stores/follows'
    import { useAuthStore } from '@/stores/auth'
    import {Book, useBooksStore} from '@/stores/books'
    import Button from 'primevue/button'
    import InputText from 'primevue/inputtext'
    import Card from 'primevue/card'
    import Tabs from 'primevue/tabs'
    import Tab from 'primevue/tab'
    import TabList from 'primevue/tablist'
    import TabPanel from 'primevue/tabpanel'
    import TabPanels from 'primevue/tabpanels'
    import BookDetail from "@/components/BookDetail.vue";
    import axios from 'axios'

    const followsStore = useFollowsStore()
    const authStore = useAuthStore()
    const booksStore = useBooksStore()

    const searchQuery = ref('')
    const searchResult = ref<{ id: number; username: string } | null>(null)
    const searchError = ref<string | null>(null)
    const isSearching = ref(false)

    onMounted(async () => {
        await followsStore.loadFollowing()
        await followsStore.loadFollowers()
        await followsStore.loadFriendRecommendations()
    })

    async function searchUser() {
        if (!searchQuery.value.trim()) return
        isSearching.value = true
        searchError.value = null
        searchResult.value = null
        try {
            const res = await axios.get('/api/users/lookup', {
                params: { username: searchQuery.value.trim() },
            })
            searchResult.value = res.data.user
        } catch (err: any) {
            searchError.value = err.response?.data?.error ?? 'User not found.'
        } finally {
            isSearching.value = false
        }
    }

    async function followFromSearch() {
        if (!searchResult.value) return
        await followsStore.followUser(searchResult.value.id)
        searchResult.value = null
        searchQuery.value = ''
    }

    function openDetail(book: Book) {
        booksStore.selectBook(book);
    }
</script>

<template>
    <div class="flex flex-col gap-6 p-6 max-w-full">

        <h1 class="text-2xl font-bold text-color">Friends</h1>

        <!-- Find & follow -->
        <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold text-color">Find a user</p>
            <div class="flex gap-2">
                <InputText v-model="searchQuery"
                           placeholder="Search by username…"
                           class="flex-1"
                           @keyup.enter="searchUser" />
                <Button icon="pi pi-search"
                        :loading="isSearching"
                        @click="searchUser" />
            </div>

            <p v-if="searchError" class="text-xs text-red-500">{{ searchError }}</p>

            <div v-if="searchResult"
                 class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg px-4 py-3">
                <div>
                    <p class="font-semibold text-color">@{{ searchResult.username }}</p>
                </div>
                <Button v-if="!followsStore.isFollowing(searchResult.id)"
                        label="Follow"
                        icon="pi pi-user-plus"
                        size="small"
                        @click="followFromSearch" />
                <Button v-else
                        label="Following"
                        icon="pi pi-check"
                        size="small"
                        severity="secondary"
                        disabled />
            </div>
        </div>

        <!-- Tabs: Following / Followers / Friend Recs -->
        <Tabs value="following">
            <TabList>
                <Tab value="following">
                    Following
                    <span class="ml-1 text-xs text-surface-400">({{ followsStore.following.length }})</span>
                </Tab>
                <Tab value="followers">
                    Followers
                    <span class="ml-1 text-xs text-surface-400">({{ followsStore.followers.length }})</span>
                </Tab>
                <Tab value="recs">Friend Picks</Tab>
            </TabList>

            <TabPanels>
                <!-- Following tab -->
                <TabPanel value="following">
                    <div v-if="!followsStore.following.length" class="py-10 text-center text-surface-400 text-sm">
                        You're not following anyone yet. Search for users above.
                    </div>
                    <div v-else class="flex flex-col gap-2 mt-3">
                        <div v-for="user in followsStore.following"
                             :key="user.id"
                             class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg px-4 py-3">
                            <div>
                                <p class="font-medium text-color">
                                    {{ user.first_name }} {{ user.last_name }}
                                </p>
                                <p class="text-xs text-surface-400">@{{ user.username }}</p>
                            </div>
                            <Button label="Unfollow"
                                    icon="pi pi-user-minus"
                                    size="small"
                                    severity="secondary"
                                    @click="followsStore.unfollowUser(user.id)" />
                        </div>
                    </div>
                </TabPanel>

                <!-- Followers tab -->
                <TabPanel value="followers">
                    <div v-if="!followsStore.followers.length" class="py-10 text-center text-surface-400 text-sm">
                        No followers yet.
                    </div>
                    <div v-else class="flex flex-col gap-2 mt-3">
                        <div v-for="user in followsStore.followers"
                             :key="user.id"
                             class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg px-4 py-3">
                            <div>
                                <p class="font-medium text-color">
                                    {{ user.first_name }} {{ user.last_name }}
                                </p>
                                <p class="text-xs text-surface-400">@{{ user.username }}</p>
                            </div>
                            <Button v-if="!followsStore.isFollowing(user.id)"
                                    label="Follow back"
                                    icon="pi pi-user-plus"
                                    size="small"
                                    @click="followsStore.followUser(user.id)" />
                            <span v-else class="text-xs text-surface-400 font-medium">Following</span>
                        </div>
                    </div>
                </TabPanel>

                <!-- Friend picks tab -->
                <TabPanel value="recs">
                    <div v-if="!followsStore.friendRecommendations.length"
                         class="py-10 text-center text-surface-400 text-sm">
                        <p>No picks yet.</p>
                        <p class="mt-1">Follow friends who have rated books 4★ or higher to see their recommendations here.</p>
                    </div>
                    <div v-else class="flex flex-col gap-3 mt-3">
                        <div v-for="rec in followsStore.friendRecommendations"
                             :key="`${rec.book_id}-${rec.recommended_by}`"
                             class="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 rounded-lg px-4 py-3">
                            <div class="flex-1 min-w-0">
                                <div class="inline-flex items-center gap-1.5 mt-1.5 text-sm font-medium text-primary hover:underline hover:cursor-pointer"
                                     @click="openDetail(rec)">
                                    <img :src="booksStore.coverUrl(rec.cover_i, 'S')" :alt="rec.title" />
                                    <span>{{ rec.title }}</span>
                                </div>
                                <p class="text-xs text-surface-400 mt-0.5">
                                    Rated {{ rec.rating }}★ by @{{ rec.recommended_by }}
                                </p>
                            </div>
                            <Button v-if="!booksStore.isOnShelf(rec.key)"
                                    icon="pi pi-plus"
                                    label="Add"
                                    size="small"
                                    @click="booksStore.addToShelf({ id: rec.key, title: rec.key, isbn: null, description: null, author: null, cover_i: null, first_publish_year: null, subject: [] })" />
                            <span v-else class="text-xs text-surface-400 font-medium flex items-center gap-1">
                                <i class="pi pi-check text-green-500" /> On shelf
                            </span>
                        </div>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>

    <BookDetail />
</template>

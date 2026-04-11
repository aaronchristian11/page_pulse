<script setup lang="ts">
    import { computed } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { useAuthStore } from '@/stores/auth'
    import { useBooksStore } from '@/stores/books'
    import { useGroupShelvesStore } from '@/stores/groupShelves'
    import {useRecommendationsStore} from "@/stores/recommendations";
    import {useFollowsStore} from "@/stores/follows";
    import Menubar from 'primevue/menubar'
    import Button from 'primevue/button'
    import Badge from 'primevue/badge'
    import Toast from 'primevue/toast'

    const router = useRouter();
    const route = useRoute()
    const auth = useAuthStore();
    const books = useBooksStore();
    const groupShelves = useGroupShelvesStore();
    const recommendations = useRecommendationsStore();
    const friends = useFollowsStore();

    const isLanding = computed(() => route.name === 'landing')
    const joinedGroupCount = computed(() => groupShelves.joinedGroups.length);
    const recommendationCount = computed(() => recommendations.unreadCount);
    const friendCount = computed(() => friends.followers.length);

    const menuItems = [
      { label: 'Catalogue', icon: 'pi pi-search', command: () => router.push('/catalogue') },
      { label: 'My Shelf', icon: 'pi pi-book', command: () => router.push('/shelf') },
      { label: 'Group Shelves', icon: 'pi pi-th-large', command: () => router.push('/groups') },
    ]

    function logout() {
      auth.setUser(null)
      books.shelf = [];
      groupShelves.groups = [];
      recommendations.unreadCount = 0;
      friends.followers = [];
      router.push('/')
    }
</script>

<template>
  <Toast position="top-center" />

    <Menubar :model="menuItems" class="border-0 border-b rounded-none px-4">
        <template #start>
            <RouterLink to="/" class="flex items-center gap-2 mr-4 font-bold text-lg no-underline" style="color: #42b883">
                <svg width="26" height="26" viewBox="0 0 112 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Left page -->
                    <path d="M56,4 Q28,0 4,4 L4,100 Q28,96 56,100 Z" fill="#35495e"/>
                    <!-- Right page -->
                    <path d="M56,4 Q84,0 108,4 L108,100 Q84,96 56,100 Z" fill="#2d3f51"/>
                    <!-- Spine -->
                    <line x1="56" y1="4" x2="56" y2="100" stroke="#1a1f2e" stroke-width="2.5"/>
                    <!-- Left lines -->
                    <line x1="12" y1="36" x2="50" y2="36" stroke="#42b883" stroke-width="1.5" opacity="0.35"/>
                    <line x1="12" y1="52" x2="50" y2="52" stroke="#42b883" stroke-width="1.5" opacity="0.35"/>
                    <line x1="12" y1="68" x2="50" y2="68" stroke="#42b883" stroke-width="1.5" opacity="0.35"/>
                    <!-- Pulse on right page -->
                    <polyline points="62,58 74,58 82,28 92,84 100,58 110,58" fill="none" stroke="#42b883" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Active dot -->
                    <circle cx="110" cy="58" r="6" fill="#42b883"/>
                </svg>
                PagePulse
            </RouterLink>
        </template>
        <template #end>
            <div class="flex items-center gap-3">
                <template v-if="auth.user">
                    <RouterLink to="/shelf" class="relative inline-flex">
                        <Button icon="pi pi-book" severity="secondary" text rounded
                                aria-label="My Shelf"/>
                        <Badge v-if="books.shelf && books.shelf.length"
                               :value="books.shelf.length"
                               class="absolute -top-1 -right-1"
                               size="small" />
                    </RouterLink>

                    <RouterLink to="/groups" class="relative inline-flex">
                        <Button icon="pi pi-th-large" severity="secondary" text rounded aria-label="Group Shelves" />
                        <Badge v-if="joinedGroupCount"
                               :value="joinedGroupCount"
                               class="absolute -top-1 -right-1"
                               size="small" />
                    </RouterLink>

                    <RouterLink to="/inbox" class="relative inline-flex">
                        <Button icon="pi pi-inbox" severity="secondary" text rounded aria-label="Recommendations" />
                        <Badge v-if="recommendationCount >= 0"
                               :value="recommendationCount"
                               class="absolute -top-1 -right-1"
                               size="small" />
                    </RouterLink>

                    <RouterLink to="/friends" class="relative inline-flex">
                        <Button icon="pi pi-users" severity="secondary" text rounded aria-label="Friends" />
                        <Badge v-if="friendCount >= 0"
                               :value="friendCount"
                               class="absolute -top-1 -right-1"
                               size="small" />
                    </RouterLink>

                    <RouterLink to="/profile">
                        <RouterLink to="/profile">
                            <Button severity="secondary" text rounded aria-label="My Profile">
                                <i class="pi pi-user text-sm"/>
                                <span class="text-sm text-surface-400">{{ auth.user.username }}</span>
                            </Button>
                        </RouterLink>
                    </RouterLink>
                </template>

                <template v-if="auth.user">
                    <Button icon="pi pi-sign-out"
                            severity="secondary"
                            text
                            rounded
                            aria-label="Sign out"
                            @click="logout" />
                </template>
                <template v-else>
                    <Button
                        label="Sign In"
                        icon="pi pi-user"
                        size="small"
                        @click="router.push('/login')"
                    />
                </template>

            </div>
        </template>
    </Menubar>

    <RouterView/>
</template>

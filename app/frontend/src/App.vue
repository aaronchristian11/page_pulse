<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { useGroupShelvesStore } from '@/stores/groupShelves'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'

const router = useRouter()
const auth = useAuthStore()
const books = useBooksStore()
const groupShelves = useGroupShelvesStore()

const joinedGroupCount = computed(() => groupShelves.joinedGroups.length)

const menuItems = [
  { label: 'Catalogue', icon: 'pi pi-search', to: '/' },
  { label: 'My Shelf', icon: 'pi pi-book', to: '/shelf' },
  { label: 'Group Shelves', icon: 'pi pi-users', to: '/groups' },
]

function logout() {
  auth.setUser(null)
  books.setShelf([])
  groupShelves.refresh()
  router.push('/')
}
</script>

<template>
    <Toast position="top-center"/>

    <Menubar :model="menuItems" class="border-0 border-b rounded-none px-4">
        <template #item="{ item, props }">
            <RouterLink v-if="item.to" :to="item.to" v-bind="props.action" class="flex items-center gap-2 px-3 py-2">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
            </RouterLink>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action" class="flex items-center gap-2 px-3 py-2">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
            </a>
        </template>
        <template #start>
            <RouterLink to="/"
                        class="flex items-center gap-2 mr-4 font-bold text-primary text-lg no-underline">
                <i class="pi pi-heart-fill"/>
                PagePulse
            </RouterLink>
        </template>
        <template #end>
            <div class="flex items-center gap-3">

                <!-- Shelf badge -->
                <RouterLink to="/shelf" class="relative inline-flex">
                    <Button icon="pi pi-book" severity="secondary" text rounded
                            aria-label="My Shelf"/>
                    <Badge
                        v-if="books.shelf && books.shelf.length"
                        :value="books.shelf.length"
                        class="absolute -top-1 -right-1"
                        size="small"
                    />
                </RouterLink>

        <RouterLink to="/groups" class="relative inline-flex">
          <Button icon="pi pi-users" severity="secondary" text rounded aria-label="Group Shelves" />
          <Badge
            v-if="joinedGroupCount"
            :value="joinedGroupCount"
            class="absolute -top-1 -right-1"
            severity="contrast"
            size="small"
          />
        </RouterLink>

        <!-- Logged in -->
        <template v-if="auth.user">
          <span class="text-sm text-surface-400">{{ auth.user.username }}</span>
          <Button
            icon="pi pi-sign-out"
            severity="secondary"
            text
            rounded
            aria-label="Sign out"
            @click="logout"
          />
        </template>

                <!-- Not logged in -->
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

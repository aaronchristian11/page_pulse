<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { useGroupShelvesStore } from '@/stores/groupShelves'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const books = useBooksStore()
const groupShelves = useGroupShelvesStore()

const isLanding = computed(() => route.name === 'landing')

const joinedGroupCount = computed(() => groupShelves.joinedGroups.length)

const menuItems = [
  { label: 'Catalogue', icon: 'pi pi-search', command: () => router.push('/') },
  { label: 'My Shelf', icon: 'pi pi-book', command: () => router.push('/shelf') },
  { label: 'Group Shelves', icon: 'pi pi-users', command: () => router.push('/groups') },
]

function logout() {
  auth.setUser(null)
  books.shelf = []
  router.push('/')
}
</script>

<template>
  <Toast position="top-center" />

  <Menubar v-if="!isLanding" :model="menuItems" class="border-0 border-b rounded-none px-4">
    <template #start>
      <RouterLink
        to="/"
        class="flex items-center gap-2 mr-4 font-bold text-primary text-lg no-underline"
      >
        <i class="pi pi-heart-fill" />
        PagePulse
      </RouterLink>
    </template>

    <template #end>
      <div class="flex items-center gap-3">

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

  <RouterView />
</template>
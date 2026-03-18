<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore, type Book } from '@/stores/books'
import { useGroupShelvesStore, type GroupBookEntry } from '@/stores/groupShelves'
import BookDetail from '@/components/BookDetail.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()
const books = useBooksStore()
const groups = useGroupShelvesStore()

const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogNote = ref('')
const dialogBook = ref<Book | null>(null)
const editingEntry = ref<GroupBookEntry | null>(null)

const activeGroup = computed(() => groups.activeGroup)
const canManageActiveGroup = computed(() => !!auth.user && !!activeGroup.value?.isJoined)
const currentUsername = computed(() => auth.user?.username ?? null)
const searchResults = computed(() => books.books.slice(0, 8))
const activeRecommendations = computed(
  () => new Map(groups.activeGroupBooks.map((entry) => [entry.book.id, entry])),
)
const dialogTitle = computed(() => {
  if (editingEntry.value) {
    return 'Update your note'
  }

  return dialogBook.value ? `Recommend ${dialogBook.value.title}` : 'Recommend a book'
})

watch(
  () => activeGroup.value?.id,
  async (groupId) => {
    if (!groupId || !activeGroup.value?.isJoined) {
      return
    }

    searchQuery.value = activeGroup.value.discoveryQuery

    if (!books.searchQuery || books.searchQuery !== activeGroup.value.discoveryQuery) {
      await books.searchBooks(activeGroup.value.discoveryQuery)
    }
  },
  { immediate: true },
)

function openBookDetail(book: Book) {
  books.selectBook(book)
}

function promptSignIn(message: string) {
  toast.add({ severity: 'info', summary: message, life: 3000 })
  router.push('/login')
}

function joinGroup(groupId: string) {
  try {
    groups.joinGroup(groupId)
    toast.add({ severity: 'success', summary: 'Group joined', life: 2500 })
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: err instanceof Error ? err.message : 'Unable to join group.',
      life: 3000,
    })
  }
}

async function runSearch() {
  if (!activeGroup.value?.isJoined) {
    return
  }

  if (!searchQuery.value.trim()) {
    searchQuery.value = activeGroup.value.discoveryQuery
  }

  await books.searchBooks(searchQuery.value)
}

function openAddDialog(book: Book) {
  if (!auth.user) {
    promptSignIn('Sign in to recommend books to a group.')
    return
  }

  if (!activeGroup.value?.isJoined) {
    toast.add({ severity: 'info', summary: 'Join a group before adding books.', life: 3000 })
    return
  }

  dialogBook.value = book
  editingEntry.value = null
  dialogNote.value = ''
  dialogVisible.value = true
}

function openEditDialog(entry: GroupBookEntry) {
  dialogBook.value = entry.book
  editingEntry.value = entry
  dialogNote.value = entry.note
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  dialogBook.value = null
  editingEntry.value = null
  dialogNote.value = ''
}

function saveRecommendation() {
  if (!dialogBook.value) {
    return
  }

  try {
    if (editingEntry.value) {
      groups.updateActiveGroupBook(editingEntry.value.id, dialogNote.value)
      toast.add({ severity: 'success', summary: 'Recommendation updated', life: 2500 })
    } else {
      groups.addBookToActiveGroup(dialogBook.value, dialogNote.value)
      toast.add({ severity: 'success', summary: 'Book added to group shelf', life: 2500 })
    }

    closeDialog()
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: err instanceof Error ? err.message : 'Unable to save recommendation.',
      life: 3500,
    })
  }
}

function removeRecommendation(entry: GroupBookEntry) {
  try {
    groups.removeActiveGroupBook(entry.id)
    toast.add({ severity: 'success', summary: 'Book removed from group shelf', life: 2500 })
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: err instanceof Error ? err.message : 'Unable to remove recommendation.',
      life: 3500,
    })
  }
}

function recommendationOwnerLabel(entry: GroupBookEntry): string {
  return entry.addedBy === currentUsername.value ? 'You recommended this' : `Added by ${entry.addedBy}`
}

function isOwnedByCurrentUser(entry: GroupBookEntry): boolean {
  return entry.addedBy === currentUsername.value
}
</script>

<template>
  <main class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-color">Group Shelves</h1>
        <p class="text-sm text-surface-400">
          Browse shared shelves, join a group, and keep each member in control of their own recommendations.
        </p>
      </div>
      <Tag value="Default groups: Fiction and Non-fiction" severity="secondary" />
    </div>

    <Card v-if="!auth.user" class="border border-dashed border-primary/30">
      <template #content>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="font-semibold text-color">Browse first, sign in when you want to join.</p>
            <p class="text-sm text-surface-400">
              Group membership and book ownership are tied to the signed-in username.
            </p>
          </div>
          <Button label="Sign In" icon="pi pi-user" @click="router.push('/login')" />
        </div>
      </template>
    </Card>

    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold text-color">Available groups</h2>
          <p class="text-sm text-surface-400">Join one to unlock its shared shelf and recommendation tools.</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <Card
          v-for="group in groups.groups"
          :key="group.id"
          :class="[
            'transition-shadow duration-200',
            groups.activeGroupId === group.id ? 'ring-1 ring-primary shadow-md' : 'hover:shadow-md',
          ]"
        >
          <template #title>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-xl font-semibold text-color">{{ group.name }}</h3>
                <p class="mt-1 text-sm text-surface-400">{{ group.description }}</p>
              </div>
              <Tag :value="group.isJoined ? 'Joined' : 'Open'" :severity="group.isJoined ? 'success' : 'secondary'" />
            </div>
          </template>
          <template #content>
            <div class="flex gap-3 flex-wrap text-sm text-surface-400">
              <span><i class="pi pi-users mr-2" />{{ group.memberCount }} member{{ group.memberCount !== 1 ? 's' : '' }}</span>
              <span><i class="pi pi-book mr-2" />{{ group.bookCount }} recommendation{{ group.bookCount !== 1 ? 's' : '' }}</span>
            </div>
          </template>
          <template #footer>
            <div class="flex gap-2 flex-wrap">
              <Button
                label="Preview"
                icon="pi pi-eye"
                severity="secondary"
                outlined
                @click="groups.selectGroup(group.id)"
              />
              <Button
                v-if="group.isJoined"
                label="Open shelf"
                icon="pi pi-arrow-right"
                @click="groups.selectGroup(group.id)"
              />
              <Button
                v-else
                label="Join group"
                icon="pi pi-user-plus"
                :disabled="!auth.user"
                @click="auth.user ? joinGroup(group.id) : promptSignIn('Sign in to join a group.')"
              />
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section v-if="groups.joinedGroups.length" class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold text-color">Your group shelves</h2>
          <p class="text-sm text-surface-400">Switch between the groups you have already joined.</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="group in groups.joinedGroups"
            :key="group.id"
            :label="group.name"
            :severity="groups.activeGroupId === group.id ? 'primary' : 'secondary'"
            :outlined="groups.activeGroupId !== group.id"
            size="small"
            @click="groups.selectGroup(group.id)"
          />
        </div>
      </div>

      <Card v-if="activeGroup">
        <template #content>
          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
              <p class="text-xs uppercase tracking-wide text-surface-400">Active group</p>
              <p class="mt-2 text-xl font-semibold text-color">{{ activeGroup.name }}</p>
            </div>
            <div class="rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
              <p class="text-xs uppercase tracking-wide text-surface-400">Members</p>
              <p class="mt-2 text-xl font-semibold text-color">{{ activeGroup.memberCount }}</p>
            </div>
            <div class="rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
              <p class="text-xs uppercase tracking-wide text-surface-400">Permission rule</p>
              <p class="mt-2 text-sm font-medium text-color">Only the member who added a book can edit or remove it.</p>
            </div>
          </div>
        </template>
      </Card>

      <Card v-if="activeGroup?.isJoined">
        <template #title>
          <div class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-color">Recommend a book to {{ activeGroup.name }}</h3>
              <p class="text-sm text-surface-400">Search Open Library, then add a short note for the group.</p>
            </div>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="flex gap-2 flex-col sm:flex-row">
              <InputText
                v-model="searchQuery"
                class="w-full"
                placeholder="Search by title, author, or topic"
                @keydown.enter="runSearch"
              />
              <Button
                label="Search"
                icon="pi pi-search"
                :loading="books.isLoading"
                @click="runSearch"
              />
            </div>

            <div v-if="books.isLoading" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="n in 4"
                :key="n"
                class="h-40 rounded-xl bg-surface-100 animate-pulse dark:bg-surface-800"
              />
            </div>

            <div v-else-if="searchResults.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card v-for="book in searchResults" :key="book.id" class="h-full">
                <template #content>
                  <div class="flex h-full flex-col gap-3">
                    <div class="flex gap-3">
                      <div class="h-20 w-14 overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
                        <img
                          v-if="book.cover_i"
                          :src="books.coverUrl(book.cover_i, 'S')"
                          :alt="book.title"
                          class="h-full w-full object-cover"
                        />
                        <div v-else class="flex h-full w-full items-center justify-center text-lg text-surface-400 font-serif">
                          {{ book.title.charAt(0) }}
                        </div>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-color line-clamp-2">{{ book.title }}</p>
                        <p v-if="book.author" class="text-sm text-primary truncate">{{ book.author }}</p>
                        <p v-if="book.first_publish_year" class="text-xs text-surface-400 mt-1">{{ book.first_publish_year }}</p>
                      </div>
                    </div>

                    <div class="mt-auto flex flex-col gap-2">
                      <Button
                        label="Details"
                        icon="pi pi-arrow-up-right"
                        severity="secondary"
                        outlined
                        size="small"
                        @click="openBookDetail(book)"
                      />
                      <Button
                        v-if="!activeRecommendations.get(book.id)"
                        label="Recommend to group"
                        icon="pi pi-plus"
                        size="small"
                        @click="openAddDialog(book)"
                      />
                      <Button
                        v-else-if="activeRecommendations.get(book.id)?.addedBy === currentUsername"
                        label="Edit my note"
                        icon="pi pi-pencil"
                        size="small"
                        @click="openEditDialog(activeRecommendations.get(book.id)!)"
                      />
                      <Button
                        v-else
                        :label="`Already added by ${activeRecommendations.get(book.id)?.addedBy}`"
                        icon="pi pi-lock"
                        severity="secondary"
                        disabled
                        size="small"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <div v-else class="rounded-xl border border-dashed border-surface-300 p-6 text-center dark:border-surface-700">
              <p class="font-medium text-color">No discovery results yet</p>
              <p class="text-sm text-surface-400">Run a search to find books to recommend to the group.</p>
            </div>
          </div>
        </template>
      </Card>

      <Card v-if="activeGroup?.isJoined">
        <template #title>
          <div class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-color">{{ activeGroup.name }} shelf</h3>
              <p class="text-sm text-surface-400">Shared recommendations with ownership visible on every entry.</p>
            </div>
            <Tag :value="`${groups.activeGroupBooks.length} books`" severity="contrast" />
          </div>
        </template>
        <template #content>
          <div v-if="groups.activeGroupBooks.length" class="flex flex-col gap-3">
            <Card v-for="entry in groups.activeGroupBooks" :key="entry.id">
              <template #content>
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <button
                    class="group flex gap-4 text-left"
                    type="button"
                    @click="openBookDetail(entry.book)"
                  >
                    <div class="h-24 w-16 overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
                      <img
                        v-if="entry.book.cover_i"
                        :src="books.coverUrl(entry.book.cover_i, 'S')"
                        :alt="entry.book.title"
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="flex h-full w-full items-center justify-center text-xl text-surface-400 font-serif">
                        {{ entry.book.title.charAt(0) }}
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-lg font-semibold text-color group-hover:text-primary transition-colors">
                          {{ entry.book.title }}
                        </p>
                        <Tag :value="recommendationOwnerLabel(entry)" :severity="isOwnedByCurrentUser(entry) ? 'success' : 'secondary'" />
                      </div>
                      <p v-if="entry.book.author" class="text-sm text-primary mt-1">{{ entry.book.author }}</p>
                      <p class="text-xs text-surface-400 mt-2">
                        Added {{ new Date(entry.addedAt).toLocaleDateString() }}
                      </p>
                      <p v-if="entry.note" class="mt-3 text-sm leading-relaxed text-color">{{ entry.note }}</p>
                      <p v-else class="mt-3 text-sm italic text-surface-400">No note added yet.</p>
                    </div>
                  </button>

                  <div class="flex gap-2 lg:ml-auto lg:flex-col">
                    <Button
                      v-if="isOwnedByCurrentUser(entry)"
                      label="Edit note"
                      icon="pi pi-pencil"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="openEditDialog(entry)"
                    />
                    <Button
                      v-if="isOwnedByCurrentUser(entry)"
                      label="Remove"
                      icon="pi pi-trash"
                      severity="danger"
                      outlined
                      size="small"
                      @click="removeRecommendation(entry)"
                    />
                    <Tag
                      v-else
                      value="Read-only for non-owners"
                      severity="secondary"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <div v-else class="rounded-xl border border-dashed border-surface-300 p-8 text-center dark:border-surface-700">
            <i class="pi pi-book text-4xl text-surface-300" />
            <p class="mt-3 font-medium text-color">No recommendations in this group yet</p>
            <p class="text-sm text-surface-400">Use the search panel above to add the first group recommendation.</p>
          </div>
        </template>
      </Card>
    </section>

    <Card v-else class="border border-dashed border-surface-300 dark:border-surface-700">
      <template #content>
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <i class="pi pi-users text-4xl text-surface-300" />
          <p class="font-semibold text-color">You have not joined a group yet</p>
          <p class="max-w-xl text-sm text-surface-400">
            Browse the available groups above and join one to start building a shared shelf with ownership-aware permissions.
          </p>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="dialogTitle"
      class="w-[92vw] max-w-xl"
      @hide="closeDialog"
    >
      <div class="flex flex-col gap-4">
        <div v-if="dialogBook" class="rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
          <p class="font-semibold text-color">{{ dialogBook.title }}</p>
          <p v-if="dialogBook.author" class="text-sm text-primary mt-1">{{ dialogBook.author }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-color" for="group-note">Why are you recommending it?</label>
          <Textarea
            id="group-note"
            v-model="dialogNote"
            rows="5"
            autoResize
            placeholder="Share why this belongs on the group shelf."
          />
          <p class="text-xs text-surface-400">Only you can edit or remove this recommendation after saving it.</p>
        </div>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" text @click="closeDialog" />
          <Button :label="editingEntry ? 'Save changes' : 'Add to group shelf'" @click="saveRecommendation" />
        </div>
      </div>
    </Dialog>

    <BookDetail />
  </main>
</template>
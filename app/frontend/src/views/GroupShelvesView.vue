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
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import Avatar from 'primevue/avatar'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()
const books = useBooksStore()
const groups = useGroupShelvesStore()

// ─── state ───────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const activeTab = ref<'shelf' | 'members' | 'discover'>('shelf')

// Add/edit book dialog
const bookDialogVisible = ref(false)
const bookDialogNote = ref('')
const bookDialogBook = ref<Book | null>(null)
const editingEntry = ref<GroupBookEntry | null>(null)

// Add member dialog
const addMemberDialogVisible = ref(false)
const addMemberUsername = ref('')
const addMemberLoading = ref(false)

// Create group dialog
const createDialogVisible = ref(false)
const createGroupName = ref('')
const createGroupDesc = ref('')
const createGroupLoading = ref(false)

// ─── computed ─────────────────────────────────────────────────────────────────
const activeGroup = computed(() => groups.activeGroup)
const isAdmin = computed(() => groups.isActiveGroupAdmin)
const currentUsername = computed(() => auth.user?.username ?? null)
const searchResults = computed(() => books.books.slice(0, 8))
const activeRecommendations = computed(
  () => new Map(groups.activeGroupBooks.map((e) => [e.book.id, e])),
)
const bookDialogTitle = computed(() =>
  editingEntry.value ? 'Update your note' : bookDialogBook.value ? `Add "${bookDialogBook.value.title}"` : 'Add a book',
)

// ─── watchers ─────────────────────────────────────────────────────────────────
watch(
  () => activeGroup.value?.id,
  async (groupId) => {
    if (!groupId || !activeGroup.value?.isJoined) return
    searchQuery.value = activeGroup.value.discoveryQuery
    if (!books.searchQuery || books.searchQuery !== activeGroup.value.discoveryQuery) {
      await books.searchBooks(activeGroup.value.discoveryQuery)
    }
  },
  { immediate: true },
)

// ─── helpers ──────────────────────────────────────────────────────────────────
function promptSignIn(message: string) {
  toast.add({ severity: 'info', summary: message, life: 3000 })
  router.push('/login')
}

function openBookDetail(book: Book) {
  books.selectBook(book)
}

// ─── group actions ────────────────────────────────────────────────────────────
async function joinGroup(groupId: string) {
  if (!auth.user) { promptSignIn('Sign in to join a group.'); return }
  try {
    await groups.joinGroup(groupId)
    toast.add({ severity: 'success', summary: 'Joined group!', life: 2500 })
    activeTab.value = 'shelf'
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to join.', life: 3000 })
  }
}

async function submitCreateGroup() {
  if (!createGroupName.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Group name is required.', life: 2500 })
    return
  }
  createGroupLoading.value = true
  try {
    await groups.createGroup(createGroupName.value, createGroupDesc.value)
    toast.add({ severity: 'success', summary: `Group "${createGroupName.value}" created!`, life: 2500 })
    createDialogVisible.value = false
    createGroupName.value = ''
    createGroupDesc.value = ''
    activeTab.value = 'shelf'
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to create group.', life: 3000 })
  } finally {
    createGroupLoading.value = false
  }
}

async function submitAddMember() {
  if (!addMemberUsername.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Username is required.', life: 2500 })
    return
  }
  addMemberLoading.value = true
  try {
    await groups.addMember(addMemberUsername.value.trim())
    toast.add({ severity: 'success', summary: `${addMemberUsername.value} added to group!`, life: 2500 })
    addMemberDialogVisible.value = false
    addMemberUsername.value = ''
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Failed to add member.', life: 3000 })
  } finally {
    addMemberLoading.value = false
  }
}

// ─── member actions ───────────────────────────────────────────────────────────
function confirmRemoveMember(username: string) {
  confirm.require({
    message: `Remove ${username} from the group? Their book recommendations will also be deleted.`,
    header: 'Remove member',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Remove',
    acceptClass: 'p-button-danger',
    accept: () => {
      try {
        groups.removeMember(username)
        toast.add({ severity: 'success', summary: `${username} removed.`, life: 2500 })
      } catch (err: unknown) {
        toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Failed to remove.', life: 3000 })
      }
    },
  })
}

function confirmPromoteAdmin(username: string) {
  confirm.require({
    message: `Make ${username} the new admin? You will become a regular member.`,
    header: 'Transfer admin',
    icon: 'pi pi-shield',
    rejectLabel: 'Cancel',
    acceptLabel: 'Transfer',
    accept: () => {
      try {
        groups.promoteToAdmin(username)
        toast.add({ severity: 'success', summary: `${username} is now admin.`, life: 2500 })
      } catch (err: unknown) {
        toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Failed to promote.', life: 3000 })
      }
    },
  })
}

// ─── book actions ─────────────────────────────────────────────────────────────
async function runSearch() {
  if (!activeGroup.value?.isJoined) return
  if (!searchQuery.value.trim()) searchQuery.value = activeGroup.value.discoveryQuery
  await books.searchBooks(searchQuery.value)
}

function openAddDialog(book: Book) {
  if (!auth.user) { promptSignIn('Sign in to recommend books.'); return }
  if (!activeGroup.value?.isJoined) { toast.add({ severity: 'info', summary: 'Join this group first.', life: 3000 }); return }
  bookDialogBook.value = book
  editingEntry.value = null
  bookDialogNote.value = ''
  bookDialogVisible.value = true
}

function openEditDialog(entry: GroupBookEntry) {
  bookDialogBook.value = entry.book
  editingEntry.value = entry
  bookDialogNote.value = entry.note
  bookDialogVisible.value = true
}

function closeBookDialog() {
  bookDialogVisible.value = false
  bookDialogBook.value = null
  editingEntry.value = null
  bookDialogNote.value = ''
}

function saveRecommendation() {
  if (!bookDialogBook.value) return
  try {
    if (editingEntry.value) {
      groups.updateActiveGroupBook(editingEntry.value.id, bookDialogNote.value)
      toast.add({ severity: 'success', summary: 'Recommendation updated', life: 2500 })
    } else {
      groups.addBookToActiveGroup(bookDialogBook.value, bookDialogNote.value)
      toast.add({ severity: 'success', summary: 'Book added to group shelf', life: 2500 })
    }
    closeBookDialog()
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to save.', life: 3500 })
  }
}

function removeBook(entry: GroupBookEntry) {
  try {
    groups.removeActiveGroupBook(entry.id)
    toast.add({ severity: 'success', summary: 'Book removed', life: 2500 })
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to remove.', life: 3500 })
  }
}

function isOwnBook(entry: GroupBookEntry) {
  return entry.addedBy === currentUsername.value
}

function canRemoveBook(entry: GroupBookEntry) {
  return isOwnBook(entry) || isAdmin.value
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}
</script>

<template>
  <ConfirmDialog />

  <main class="flex flex-col gap-6 p-6 max-w-6xl mx-auto">

    <!-- ── Page Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-4xl font-bold text-color">Group Shelves</h1>
        <p class="text-base text-surface-400 mt-2">
          Join a group to build a shared bookshelf together.
        </p>
      </div>
      <Button
        v-if="auth.user"
        label="Create Group"
        icon="pi pi-plus"
        @click="createDialogVisible = true"
      />
      <Button
        v-else
        label="Sign in to create a group"
        icon="pi pi-user"
        severity="secondary"
        outlined
        @click="router.push('/login')"
      />
    </div>

    <!-- ── Sign-in nudge ───────────────────────────────────────────────────── -->
    <Card v-if="!auth.user" class="border border-dashed border-primary/30">
      <template #content>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="font-semibold text-color">Browse groups, sign in when you're ready to join.</p>
            <p class="text-sm text-surface-400">Membership and book ownership are tied to your account.</p>
          </div>
          <Button label="Sign In" icon="pi pi-user" @click="router.push('/login')" />
        </div>
      </template>
    </Card>

    <!-- ── Two-column layout when a group is active ───────────────────────── -->
    <div v-if="activeGroup?.isJoined" class="flex flex-col gap-6 lg:flex-row lg:items-start">

      <!-- LEFT: sidebar – group list + members ───────────────────────────── -->
      <aside class="flex flex-col gap-4 lg:w-72 lg:flex-shrink-0">

        <!-- Group switcher -->
        <Card>
          <template #title>
            <h2 class="text-lg font-semibold text-color">Your Groups</h2>
          </template>
          <template #content>
            <div class="flex flex-col gap-1">
              <button
                v-for="group in groups.joinedGroups"
                :key="group.id"
                :class="[
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors w-full',
                  groups.activeGroupId === group.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-color',
                ]"
                @click="groups.selectGroup(group.id); activeTab = 'shelf'"
              >
                <i class="pi pi-users text-sm" />
                <span class="flex-1 font-medium text-base truncate">{{ group.name }}</span>
                <Tag
                  v-if="group.currentUserRole === 'admin'"
                  value="Admin"
                  severity="warn"
                  class="text-xs"
                />
              </button>
            </div>
          </template>
        </Card>

        <!-- Members panel -->
        <Card v-if="activeGroup">
          <template #title>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-color">Members</h2>
              <div class="flex items-center gap-2">
                <Tag :value="`${activeGroup.memberCount}`" severity="secondary" />
                <Button
                  v-if="isAdmin"
                  v-tooltip.top="'Add member'"
                  icon="pi pi-user-plus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="addMemberDialogVisible = true"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <div
                v-for="member in groups.activeGroupMembers"
                :key="member.username"
                class="flex items-center gap-3 rounded-lg p-3"
              >
                <Avatar
                  :label="initials(member.username)"
                  shape="circle"
                  :class="member.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' : 'bg-surface-100 dark:bg-surface-800 text-color'"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-base font-medium text-color truncate">
                    {{ member.username }}
                    <span v-if="member.username === currentUsername" class="text-surface-400 font-normal"> (you)</span>
                  </p>
                  <p class="text-sm text-surface-400 capitalize">{{ member.role }}</p>
                </div>

                <!-- Admin controls -->
                <div v-if="isAdmin && member.username !== currentUsername" class="flex gap-1">
                  <Button
                    v-tooltip.top="'Make admin'"
                    icon="pi pi-shield"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    @click="confirmPromoteAdmin(member.username)"
                  />
                  <Button
                    v-tooltip.top="'Remove member'"
                    icon="pi pi-user-minus"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="confirmRemoveMember(member.username)"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

      </aside>

      <!-- RIGHT: main content area ─────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col gap-4 min-w-0">

        <!-- Group header -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-3xl font-bold text-color">{{ activeGroup.name }}</h2>
            <p class="text-base text-surface-400 mt-1">{{ activeGroup.description }}</p>
          </div>
          <Tag
            v-if="isAdmin"
            value="You are the admin"
            severity="warn"
            icon="pi pi-shield"
          />
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-surface-200 dark:border-surface-700">
          <button
            v-for="tab in [
              { key: 'shelf', label: 'Group Shelf', icon: 'pi-book', count: groups.activeGroupBooks.length },
              { key: 'discover', label: 'Add Books', icon: 'pi-search', count: null },
            ]"
            :key="tab.key"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-surface-400 hover:text-color',
            ]"
            @click="activeTab = tab.key as any"
          >
            <i :class="`pi ${tab.icon}`" />
            {{ tab.label }}
            <span
              v-if="tab.count !== null"
              class="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs px-1.5 py-0.5 rounded-full"
            >{{ tab.count }}</span>
          </button>
        </div>

        <!-- ── Tab: Group Shelf ─────────────────────────────────────────────── -->
        <div v-if="activeTab === 'shelf'" class="flex flex-col gap-3">
          <div v-if="groups.activeGroupBooks.length" class="flex flex-col gap-3">
            <Card v-for="entry in groups.activeGroupBooks" :key="entry.id">
              <template #content>
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <button
                    class="flex gap-4 text-left group"
                    type="button"
                    @click="openBookDetail(entry.book)"
                  >
                    <div class="h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
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
                      <p class="font-semibold text-base text-color group-hover:text-primary transition-colors line-clamp-2">
                        {{ entry.book.title }}
                      </p>
                      <p v-if="entry.book.author" class="text-base text-primary mt-1">{{ entry.book.author }}</p>
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <Tag
                          :value="isOwnBook(entry) ? 'Added by you' : `Added by ${entry.addedBy}`"
                          :severity="isOwnBook(entry) ? 'success' : 'secondary'"
                          class="text-xs"
                        />
                        <span class="text-xs text-surface-400">
                          {{ new Date(entry.addedAt).toLocaleDateString() }}
                        </span>
                      </div>
                      <p v-if="entry.note" class="mt-2 text-base text-color leading-relaxed">{{ entry.note }}</p>
                      <p v-else class="mt-2 text-base italic text-surface-400">No note added.</p>
                    </div>
                  </button>

                  <div class="flex gap-2 sm:ml-auto sm:flex-col sm:flex-shrink-0">
                    <Button
                      v-if="isOwnBook(entry)"
                      label="Edit note"
                      icon="pi pi-pencil"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="openEditDialog(entry)"
                    />
                    <Button
                      v-if="canRemoveBook(entry)"
                      :label="isAdmin && !isOwnBook(entry) ? 'Remove (admin)' : 'Remove'"
                      icon="pi pi-trash"
                      severity="danger"
                      outlined
                      size="small"
                      @click="removeBook(entry)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <div v-else class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-10 text-center">
            <i class="pi pi-book text-4xl text-surface-300" />
            <p class="mt-3 font-semibold text-color">No books yet</p>
            <p class="text-base text-surface-400 mt-2">Switch to "Add Books" to recommend the first one.</p>
            <Button label="Add Books" icon="pi pi-search" class="mt-4" size="small" @click="activeTab = 'discover'" />
          </div>
        </div>

        <!-- ── Tab: Discover / Add Books ───────────────────────────────────── -->
        <div v-if="activeTab === 'discover'" class="flex flex-col gap-4">
          <div class="flex gap-2 flex-col sm:flex-row">
            <InputText
              v-model="searchQuery"
              class="w-full"
              placeholder="Search by title, author, or topic"
              @keydown.enter="runSearch"
            />
            <Button label="Search" icon="pi pi-search" :loading="books.isLoading" @click="runSearch" />
          </div>

          <div v-if="books.isLoading" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div v-for="n in 4" :key="n" class="h-40 rounded-xl bg-surface-100 animate-pulse dark:bg-surface-800" />
          </div>

          <div v-else-if="searchResults.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card v-for="book in searchResults" :key="book.id" class="h-full">
              <template #content>
                <div class="flex h-full flex-col gap-3">
                  <div class="flex gap-3">
                    <div class="h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
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
                      <p class="font-semibold text-color line-clamp-2 text-base">{{ book.title }}</p>
                      <p v-if="book.author" class="text-sm text-primary truncate mt-1">{{ book.author }}</p>
                      <p v-if="book.first_publish_year" class="text-sm text-surface-400 mt-1">{{ book.first_publish_year }}</p>
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
                      label="Add to shelf"
                      icon="pi pi-plus"
                      size="small"
                      @click="openAddDialog(book)"
                    />
                    <Button
                      v-else-if="activeRecommendations.get(book.id)?.addedBy === currentUsername"
                      label="Edit my note"
                      icon="pi pi-pencil"
                      severity="secondary"
                      size="small"
                      @click="openEditDialog(activeRecommendations.get(book.id)!)"
                    />
                    <Button
                      v-else
                      :label="`Added by ${activeRecommendations.get(book.id)?.addedBy}`"
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
            <p class="font-medium text-color">No results yet</p>
            <p class="text-sm text-surface-400">Search above to find books to add to the group shelf.</p>
          </div>
        </div>

      </div>
    </div>

    <!-- ── No active group: show group browser ────────────────────────────── -->
    <div v-else class="flex flex-col gap-6">
      <div>
        <h2 class="text-2xl font-semibold text-color">Available Groups</h2>
        <p class="text-base text-surface-400 mt-1">Join one to unlock its shared shelf.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <Card
          v-for="group in groups.groups"
          :key="group.id"
          class="hover:shadow-md transition-shadow duration-200"
        >
          <template #title>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-xl font-semibold text-color">{{ group.name }}</h3>
                <p class="mt-2 text-base text-surface-400">{{ group.description }}</p>
              </div>
              <Tag
                :value="group.isJoined ? 'Joined' : 'Open'"
                :severity="group.isJoined ? 'success' : 'secondary'"
              />
            </div>
          </template>
          <template #content>
            <div class="flex gap-4 text-base text-surface-400">
              <span><i class="pi pi-users mr-1" />{{ group.memberCount }} member{{ group.memberCount !== 1 ? 's' : '' }}</span>
              <span><i class="pi pi-book mr-1" />{{ group.bookCount }} book{{ group.bookCount !== 1 ? 's' : '' }}</span>
            </div>
          </template>
          <template #footer>
            <div class="flex gap-2">
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
                @click="joinGroup(group.id)"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- empty state if no groups at all -->
      <Card v-if="!groups.groups.length" class="border border-dashed border-surface-300 dark:border-surface-700">
        <template #content>
          <div class="flex flex-col items-center gap-6 py-16 text-center">
            <i class="pi pi-users text-4xl text-surface-300" />
            <p class="font-semibold text-color">No groups yet</p>
            <p class="text-sm text-surface-400">Be the first to create one!</p>
            <Button
              v-if="auth.user"
              label="Create a Group"
              icon="pi pi-plus"
              @click="createDialogVisible = true"
            />
          </div>
        </template>
      </Card>
    </div>

  </main>

  <!-- ── Create Group Dialog ──────────────────────────────────────────────── -->
  <Dialog
    v-model:visible="createDialogVisible"
    modal
    header="Create a new group"
    class="w-[92vw] max-w-lg"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color" for="group-name">Group name *</label>
        <InputText id="group-name" v-model="createGroupName" placeholder="e.g. Sci-Fi Fans" class="w-full" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color" for="group-desc">Description</label>
        <Textarea
          id="group-desc"
          v-model="createGroupDesc"
          rows="3"
          autoResize
          placeholder="What kind of books does this group focus on?"
          class="w-full"
        />
      </div>
      <p class="text-xs text-surface-400">You will be the admin of this group and can manage members.</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" text @click="createDialogVisible = false" />
        <Button label="Create Group" icon="pi pi-plus" :loading="createGroupLoading" @click="submitCreateGroup" />
      </div>
    </div>
  </Dialog>

  <!-- ── Add/Edit Book Dialog ─────────────────────────────────────────────── -->
  <Dialog
    v-model:visible="bookDialogVisible"
    modal
    :header="bookDialogTitle"
    class="w-[92vw] max-w-xl"
    @hide="closeBookDialog"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div v-if="bookDialogBook" class="rounded-xl bg-surface-50 dark:bg-surface-900 p-4">
        <p class="font-semibold text-color">{{ bookDialogBook.title }}</p>
        <p v-if="bookDialogBook.author" class="text-sm text-primary mt-1">{{ bookDialogBook.author }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color" for="book-note">Why are you recommending it?</label>
        <Textarea
          id="book-note"
          v-model="bookDialogNote"
          rows="4"
          autoResize
          placeholder="Share why this belongs on the group shelf."
          class="w-full"
        />
        <p class="text-xs text-surface-400">Only you (or the admin) can remove this recommendation after saving.</p>
      </div>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" text @click="closeBookDialog" />
        <Button
          :label="editingEntry ? 'Save changes' : 'Add to shelf'"
          @click="saveRecommendation"
        />
      </div>
    </div>
  </Dialog>

  <BookDetail />
    <!--Add Member Dialog  -->
  <Dialog
    v-model:visible="addMemberDialogVisible"
    modal
    header="Add a member"
    class="w-[92vw] max-w-md"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color" for="add-member-username">Username</label>
        <InputText
          id="add-member-username"
          v-model="addMemberUsername"
          placeholder="Enter their username"
          class="w-full"
          @keydown.enter="submitAddMember"
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" text @click="addMemberDialogVisible = false" />
        <Button label="Add Member" icon="pi pi-user-plus" :loading="addMemberLoading" @click="submitAddMember" />
      </div>
    </div>
  </Dialog>
</template>
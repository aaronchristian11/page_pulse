<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { useToast } from 'primevue/usetoast'
    import { useAuthStore } from '@/stores/auth'
    import { useBooksStore, Book } from '@/stores/books'
    import { useGroupShelvesStore, type GroupMember } from '@/stores/groupShelves'
    import BookCard from '@/components/BookCard.vue'
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
    const activeTab = ref<'shelf' | 'discover'>('shelf')

    // Add book dialog
    const bookDialogVisible = ref(false)
    const bookDialogBook = ref<Book | null>(null)

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
    const currentUserId = computed(() => groups.currentUserId)
    const currentUsername = computed(() => groups.currentUsername)
    const searchResults = computed(() => books.books.slice(0, 8))
    const activeBookKeys = computed(() => new Set(groups.activeGroupBooks.map((e) =>e.normalizedKey)))

    // ─── watchers ─────────────────────────────────────────────────────────────────
    watch(
        () => activeGroup.value?.id,
        async (groupId) => {
            if (!groupId) return
            if (!books.books || !books.books.length) {
                await books.searchBooks('')
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

    function isOwnBook(entry: Book) {
        return entry.addedByUserId === currentUserId.value
    }

    function canRemoveBook(entry: Book) {
        return isOwnBook(entry) || isAdmin.value
    }

    function initials(username: string) {
        return username.slice(0, 2).toUpperCase()
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
    function confirmRemoveMember(member: GroupMember) {
        confirm.require({
            message: `Remove ${member.username} from the group?`,
            header: 'Remove member',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancel',
            acceptLabel: 'Remove',
            acceptClass: 'p-button-danger',
            accept: async () => {
                try {
                    await groups.removeMember(member.id)
                    toast.add({ severity: 'success', summary: `${member.username} removed.`, life: 2500 })
                } catch (err: unknown) {
                    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Failed to remove.', life: 3000 })
                }
            },
        })
    }

    function confirmPromoteAdmin(member: GroupMember) {
        confirm.require({
            message: `Make ${member.username} the new admin? You will become a regular member.`,
            header: 'Transfer admin',
            icon: 'pi pi-shield',
            rejectLabel: 'Cancel',
            acceptLabel: 'Transfer',
            accept: async () => {
                try {
                    await groups.promoteToAdmin(member.id)
                    toast.add({ severity: 'success', summary: `${member.username} is now admin.`, life: 2500 })
                } catch (err: unknown) {
                    toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Failed to promote.', life: 3000 })
                }
            },
        })
    }

    // ─── book actions ─────────────────────────────────────────────────────────────
    async function runSearch() {
        await books.searchBooks(searchQuery.value)
    }

    function openAddDialog(book: Book) {
        if (!auth.user) { promptSignIn('Sign in to recommend books.'); return }
        if (!activeGroup.value?.isJoined) {
            toast.add({ severity: 'info', summary: 'Join this group first.', life: 3000 })
            return
        }
        bookDialogBook.value = book
        bookDialogVisible.value = true
    }

    function closeBookDialog() {
        bookDialogVisible.value = false
        bookDialogBook.value = null
    }

    async function saveRecommendation() {
        if (!bookDialogBook.value) return
        try {
            await groups.addBookToActiveGroup(bookDialogBook.value)
            toast.add({ severity: 'success', summary: 'Book added to group shelf', life: 2500 })
            closeBookDialog()
        } catch (err: unknown) {
            toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to save.', life: 3500 })
        }
    }

    async function removeBook(entry: Book) {
        try {
            await groups.removeActiveGroupBook(entry.id)
            toast.add({ severity: 'success', summary: 'Book removed', life: 2500 })
        } catch (err: unknown) {
            toast.add({ severity: 'error', summary: err instanceof Error ? err.message : 'Unable to remove.', life: 3500 })
        }
    }
</script>

<template>
    <ConfirmDialog/>

    <main class="flex flex-col gap-6 p-6 max-w-full">

        <!-- ── Page Header ─────────────────────────────────────────────────────── -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 class="text-3xl font-bold text-color">Group Shelves</h1>
                <p class="text-sm text-surface-400 mt-1">Join a group to build a shared bookshelf together.</p>
            </div>
            <Button v-if="auth.user" label="Create Group" icon="pi pi-plus" @click="createDialogVisible = true"/>
            <Button v-else label="Sign in to create a group" icon="pi pi-user" severity="secondary" outlined
                    @click="router.push('/login')"/>
        </div>

        <!-- ── Sign-in nudge ───────────────────────────────────────────────────── -->
        <Card v-if="!auth.user" class="border border-dashed border-primary/30">
            <template #content>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p class="font-semibold text-color">Browse groups, sign in when you're ready to join.</p>
                        <p class="text-sm text-surface-400">Membership and book ownership are tied to your account.</p>
                    </div>
                    <Button label="Sign In" icon="pi pi-user" @click="router.push('/login')"/>
                </div>
            </template>
        </Card>

        <!-- ── Two-column layout when a group is active ───────────────────────── -->
        <div v-if="activeGroup?.isJoined" class="flex flex-col gap-6 lg:flex-row lg:items-start">

            <!-- LEFT: sidebar ───────────────────────────────────────────────── -->
            <aside class="flex flex-col gap-4 lg:w-72 lg:flex-shrink-0">

                <!-- Group switcher -->
                <Card>
                    <template #title>
                        <h2 class="text-base font-semibold text-color">Your Groups</h2>
                    </template>
                    <template #content>
                        <div class="flex flex-col gap-1">
                            <button v-for="group in groups.joinedGroups"
                                    :key="group.id"
                                    :class="[
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors w-full',
                                        groups.activeGroupId === group.id
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-color',
                                    ]"
                                    @click="groups.selectGroup(group.id); activeTab = 'shelf'">
                                <i class="pi pi-users text-sm"/>
                                <span class="flex-1 font-medium text-sm truncate">{{ group.name }}</span>
                                <Tag v-if="group.currentUserRole === 'Administrator'"
                                     value="Admin"
                                     severity="warn"
                                     class="text-xs" />
                            </button>
                        </div>
                    </template>
                </Card>

                <!-- Members panel -->
                <Card v-if="activeGroup">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <h2 class="text-base font-semibold text-color">Members</h2>
                            <div class="flex items-center gap-2">
                                <Tag :value="`${activeGroup.memberCount}`" severity="secondary"/>
                                <Button v-if="isAdmin"
                                        v-tooltip.top="'Add member'"
                                        icon="pi pi-user-plus"
                                        severity="secondary"
                                        text
                                        rounded
                                        size="small"
                                        @click="addMemberDialogVisible = true" />
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <div class="flex flex-col gap-2">
                            <div v-for="member in groups.activeGroupMembers"
                                 :key="member.username"
                                 class="flex items-center gap-3 rounded-lg p-2">
                                <Avatar :label="initials(member.username)"
                                        shape="circle"
                                        :class="member.role === 'Administrator'
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
                                            : 'bg-surface-100 dark:bg-surface-800 text-color'" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-color truncate">
                                        {{ member.username }}
                                        <span v-if="member.username === currentUsername"
                                              class="text-surface-400 font-normal"> (you)</span>
                                    </p>
                                    <p class="text-xs text-surface-400 capitalize">{{ member.role }}</p>
                                </div>

                                <!-- Admin controls -->
                                <div v-if="isAdmin && member.username !== currentUsername" class="flex gap-1">
                                    <Button v-tooltip.top="'Make admin'"
                                            icon="pi pi-shield"
                                            severity="secondary"
                                            text
                                            rounded
                                            size="small"
                                            @click="confirmPromoteAdmin(member)" />
                                    <Button v-tooltip.top="'Remove member'"
                                            icon="pi pi-user-minus"
                                            severity="danger"
                                            text
                                            rounded
                                            size="small"
                                            @click="confirmRemoveMember(member)" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

            </aside>

            <!-- RIGHT: main content area ─────────────────────────────────────── -->
            <div class="flex-1 flex flex-col gap-4 min-w-0">

                <!-- Group header -->
                <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2 class="text-2xl font-bold text-color">{{ activeGroup.name }}</h2>
                        <p class="text-sm text-surface-400">{{ activeGroup.description }}</p>
                    </div>
                    <Tag v-if="isAdmin" value="You are the admin" severity="warn" icon="pi pi-shield"/>
                </div>

                <!-- Tabs -->
                <div class="flex gap-1 border-b border-surface-200 dark:border-surface-700">
                    <button v-for="tab in [
                                { key: 'shelf', label: 'Group Shelf', icon: 'pi-book', count: groups.activeGroupBooks.length },
                                { key: 'discover', label: 'Add Books', icon: 'pi-search', count: null },
                            ]"
                            :key="tab.key"
                            :class="[
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-surface-400 hover:text-color',
                            ]"
                            @click="activeTab = tab.key">
                        <i :class="`pi ${tab.icon}`"/>
                        {{ tab.label }}
                        <span
                            v-if="tab.count !== null"
                            class="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs px-1.5 py-0.5 rounded-full"
                        >{{ tab.count }}</span>
                    </button>
                </div>

                <!-- ── Tab: Group Shelf ─────────────────────────────────────────── -->
                <div v-if="activeTab === 'shelf'" class="flex flex-col gap-4">

                    <!-- Loading -->
                    <div v-if="groups.isLoading"
                         class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        <div v-for="n in 8" :key="n"
                             class="rounded-lg overflow-hidden animate-pulse bg-surface-100 dark:bg-surface-800">
                            <div class="aspect-[2/3] bg-surface-200 dark:bg-surface-700"/>
                            <div class="p-3 flex flex-col gap-2">
                                <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4"/>
                                <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2"/>
                            </div>
                        </div>
                    </div>

                    <!-- Book grid -->
                    <div v-else-if="groups.activeGroupBooks.length"
                         class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                        <div v-for="entry in groups.activeGroupBooks"
                             :key="entry.id"
                             class="relative group h-full">
                            <!-- BookCard — opens detail drawer -->
                            <BookCard :book="entry"
                                      class="h-full"
                                      @select="openBookDetail" />

                            <!-- "Added by" badge — top-left -->
                            <div class="absolute top-2 left-2 z-10">
                                <span :class="[
                                            'text-xs font-medium px-1.5 py-0.5 rounded-full',
                                            isOwnBook(entry)
                                                ? 'bg-emerald-600/90 text-white'
                                                : 'bg-surface-900/70 text-surface-200',
                                       ]">
                                    {{ isOwnBook(entry) ? 'You' : entry.addedBy }}
                                </span>
                            </div>

                            <!-- Remove button — top-right, on hover -->
                            <button v-if="canRemoveBook(entry)"
                                    class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                           bg-surface-900/70 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                                    :aria-label="isAdmin && !isOwnBook(entry) ? 'Remove (admin)' : 'Remove'"
                                    @click.stop="removeBook(entry)">
                                <i class="pi pi-trash text-xs"/>
                            </button>
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div v-else
                         class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-10 text-center">
                        <i class="pi pi-book text-4xl text-surface-300"/>
                        <p class="mt-3 font-semibold text-color">No books yet</p>
                        <p class="text-sm text-surface-400 mt-1">Switch to "Add Books" to recommend the first one.</p>
                        <Button label="Add Books" icon="pi pi-search" class="mt-4" size="small"
                                @click="activeTab = 'discover'"/>
                    </div>
                </div>

                <!-- ── Tab: Discover / Add Books ───────────────────────────────── -->
                <div v-if="activeTab === 'discover'" class="flex flex-col gap-4">
                    <div class="flex gap-2 flex-col sm:flex-row">
                        <InputText v-model="searchQuery"
                                   class="w-full"
                                   placeholder="Search by title, author, or topic"
                                   @keydown.enter="runSearch" />
                        <Button label="Search" icon="pi pi-search" :loading="books.isLoading" @click="runSearch"/>
                    </div>

                    <div v-if="books.isLoading" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div v-for="n in 4" :key="n"
                             class="h-40 rounded-xl bg-surface-100 animate-pulse dark:bg-surface-800"/>
                    </div>

                    <div v-else-if="searchResults.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Card v-for="book in searchResults" :key="book.id" class="h-full">
                            <template #content>
                                <div class="flex h-full flex-col gap-3">
                                    <div class="flex gap-3">
                                        <div
                                            class="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
                                            <img v-if="book.cover_i"
                                                 :src="books.coverUrl(book.cover_i, 'S')"
                                                 :alt="book.title"
                                                 class="h-full w-full object-cover" />
                                            <div v-else
                                                 class="flex h-full w-full items-center justify-center text-lg text-surface-400 font-serif">
                                                {{ book.title.charAt(0) }}
                                            </div>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="font-semibold text-color line-clamp-2 text-sm">{{book.title }}</p>
                                            <p v-if="book.author"
                                               class="text-xs text-primary truncate mt-0.5">{{ book.author }}</p>
                                            <p v-if="book.first_publish_year"
                                               class="text-xs text-surface-400 mt-1">{{book.first_publish_year }}</p>
                                        </div>
                                    </div>
                                    <div class="mt-auto flex flex-col gap-2">
                                        <Button label="Details"
                                                icon="pi pi-arrow-up-right"
                                                severity="secondary"
                                                outlined
                                                size="small"
                                                @click="openBookDetail(book)" />
                                        <Button v-if="!activeBookKeys.has(book.id)"
                                                label="Add to shelf"
                                                icon="pi pi-plus"
                                                size="small"
                                                @click="openAddDialog(book)" />
                                        <Button v-else
                                                label="Already on shelf"
                                                icon="pi pi-check"
                                                severity="secondary"
                                                disabled
                                                size="small" />
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <div v-else
                         class="rounded-xl border border-dashed border-surface-300 p-6 text-center dark:border-surface-700">
                        <p class="font-medium text-color">No results yet</p>
                        <p class="text-sm text-surface-400">Search above to find books to add to the group shelf.</p>
                    </div>
                </div>

            </div>
        </div>

        <!-- ── No active group: show group browser ────────────────────────────── -->
        <div v-else class="flex flex-col gap-6">
            <div>
                <h2 class="text-xl font-semibold text-color">Available Groups</h2>
                <p class="text-sm text-surface-400 mt-0.5">Join one to unlock its shared shelf.</p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <Card v-for="group in groups.groups"
                      :key="group.id"
                      class="hover:shadow-md transition-shadow duration-200">
                    <template #title>
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <h3 class="text-lg font-semibold text-color">{{ group.name }}</h3>
                                <p class="mt-1 text-sm text-surface-400">{{ group.description }}</p>
                            </div>
                            <Tag
                                :value="group.isJoined ? 'Joined' : 'Open'"
                                :severity="group.isJoined ? 'success' : 'secondary'"
                            />
                        </div>
                    </template>
                    <template #content>
                        <div class="flex gap-4 text-sm text-surface-400">
                            <span><i class="pi pi-users mr-1"/>{{ group.memberCount }}
                                member{{ group.memberCount !== 1 ? 's' : '' }}</span>
                            <span><i class="pi pi-book mr-1"/>{{ group.bookCount }}
                                book{{ group.bookCount !== 1 ? 's' : '' }}</span>
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex gap-2">
                            <Button v-if="group.isJoined"
                                    label="Open shelf"
                                    icon="pi pi-arrow-right"
                                    @click="groups.selectGroup(group.id)" />
                            <Button v-else
                                    label="Join group"
                                    icon="pi pi-user-plus"
                                    :disabled="!auth.user"
                                    @click="joinGroup(group.id)" />
                        </div>
                    </template>
                </Card>
            </div>

            <Card v-if="!groups.groups.length"
                  class="border border-dashed border-surface-300 dark:border-surface-700">
                <template #content>
                    <div class="flex flex-col items-center gap-3 py-8 text-center">
                        <i class="pi pi-users text-4xl text-surface-300"/>
                        <p class="font-semibold text-color">No groups yet</p>
                        <p class="text-sm text-surface-400">Be the first to create one!</p>
                        <Button v-if="auth.user" label="Create a Group" icon="pi pi-plus"
                                @click="createDialogVisible = true"/>
                    </div>
                </template>
            </Card>
        </div>

    </main>

    <!-- ── Create Group Dialog ──────────────────────────────────────────────── -->
    <Dialog v-model:visible="createDialogVisible" modal header="Create a new group" class="w-[92vw] max-w-lg">
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-color" for="group-name">Group name *</label>
                <InputText id="group-name" v-model="createGroupName" placeholder="e.g. Sci-Fi Fans" class="w-full"/>
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-color" for="group-desc">Description</label>
                <Textarea id="group-desc" v-model="createGroupDesc" rows="3" autoResize
                          placeholder="What kind of books does this group focus on?" class="w-full"/>
            </div>
            <p class="text-xs text-surface-400">You will be the admin of this group and can manage members.</p>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" text @click="createDialogVisible = false"/>
                <Button label="Create Group" icon="pi pi-plus" :loading="createGroupLoading"
                        @click="submitCreateGroup"/>
            </div>
        </div>
    </Dialog>

    <!-- ── Add Book Dialog ──────────────────────────────────────────────────── -->
    <Dialog v-model:visible="bookDialogVisible" modal
            :header="bookDialogBook ? `Add &quot;${bookDialogBook.title}&quot;` : 'Add a book'"
            class="w-[92vw] max-w-xl" @hide="closeBookDialog">
        <div class="flex flex-col gap-4 pt-2">
            <div v-if="bookDialogBook" class="rounded-xl bg-surface-50 dark:bg-surface-900 p-4">
                <p class="font-semibold text-color">{{ bookDialogBook.title }}</p>
                <p v-if="bookDialogBook.author" class="text-sm text-primary mt-1">{{ bookDialogBook.author }}</p>
            </div>
            <p class="text-xs text-surface-400">Only you (or the admin) can remove this recommendation after saving.</p>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" text @click="closeBookDialog"/>
                <Button label="Add to shelf" @click="saveRecommendation"/>
            </div>
        </div>
    </Dialog>

    <!-- ── Add Member Dialog ────────────────────────────────────────────────── -->
    <Dialog v-model:visible="addMemberDialogVisible" modal header="Add a member" class="w-[92vw] max-w-md">
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-color" for="add-member-username">Username</label>
                <InputText id="add-member-username" v-model="addMemberUsername" placeholder="Enter their username"
                           class="w-full" @keydown.enter="submitAddMember"/>
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" text @click="addMemberDialogVisible = false"/>
                <Button label="Add Member" icon="pi pi-user-plus" :loading="addMemberLoading"
                        @click="submitAddMember"/>
            </div>
        </div>
    </Dialog>

    <BookDetail/>
</template>

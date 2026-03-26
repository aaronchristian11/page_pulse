import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Book } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import {
  groupShelvesApi,
  type GroupBookEntry,
  type GroupSummary,
  type GroupMember,
} from '@/services/groupShelvesApi'

export type { GroupBookEntry, GroupSummary, GroupMember } from '@/services/groupShelvesApi'

export const useGroupShelvesStore = defineStore('groupShelves', () => {
  const auth = useAuthStore()

  const groups = ref<GroupSummary[]>([])
  const activeGroupId = ref<string | null>(null)
  const activeGroupBooks = ref<GroupBookEntry[]>([])
  const activeGroupMembers = ref<GroupMember[]>([])
  const error = ref<string | null>(null)

  const currentUserId = computed(() => auth.user?.id ?? null)
  const currentUsername = computed(() => auth.user?.username ?? null)
  const joinedGroups = computed(() => groups.value.filter((g) => g.isJoined))
  const activeGroup = computed(() => groups.value.find((g) => g.id === activeGroupId.value) ?? null)
  const isActiveGroupAdmin = computed(() => activeGroup.value?.currentUserRole === 'admin')

  function clearError() { error.value = null }
  function setError(err: unknown) {
    error.value = err instanceof Error ? err.message : 'Something went wrong.'
  }

  async function loadGroups() {
    const fetched = await groupShelvesApi.listGroups(currentUserId.value)
    // Enrich each group with membership info from the members list
    const enriched = await Promise.all(
      fetched.map(async (group) => {
        const members = await groupShelvesApi.listGroupMembers(group.id)
        const books = await groupShelvesApi.listGroupBooks(group.id)
        const myMembership = members.find((m) => m.id === currentUserId.value) ?? null
        return {
          ...group,
          isJoined: !!myMembership,
          currentUserRole: myMembership?.role ?? null,
          memberCount: members.length,
          bookCount: books.length,
        } as GroupSummary
      })
    )
    groups.value = enriched
    if (!enriched.length) { activeGroupId.value = null; activeGroupBooks.value = []; return }
    const hasActive = activeGroupId.value && enriched.some((g) => g.id === activeGroupId.value)
    if (!hasActive) {
      activeGroupId.value = enriched.find((g) => g.isJoined)?.id ?? enriched[0]?.id ?? null
    }
  }

  async function loadActiveGroupBooks() {
    if (!activeGroupId.value) { activeGroupBooks.value = []; return }
    activeGroupBooks.value = await groupShelvesApi.listGroupBooks(activeGroupId.value)
  }

  async function loadActiveGroupMembers() {
    if (!activeGroupId.value) { activeGroupMembers.value = []; return }
    activeGroupMembers.value = await groupShelvesApi.listGroupMembers(activeGroupId.value)
  }

  async function refresh() {
    await loadGroups()
    await loadActiveGroupBooks()
    await loadActiveGroupMembers()
  }

  async function selectGroup(groupId: string) {
    clearError()
    activeGroupId.value = groupId
    await loadActiveGroupBooks()
    await loadActiveGroupMembers()
  }

  async function createGroup(name: string, description: string) {
    if (!currentUserId.value) throw new Error('Sign in to create a group.')
    clearError()
    try {
      const result = await groupShelvesApi.createGroup(name, description, currentUserId.value)
      await loadGroups()
      activeGroupId.value = result.id
      await loadActiveGroupBooks()
      await loadActiveGroupMembers()
      return result
    } catch (err) { setError(err); throw err }
  }

  async function joinGroup(groupId: string) {
    if (!currentUserId.value) throw new Error('Sign in to join a group.')
    clearError()
    try {
      await groupShelvesApi.joinGroup(groupId, currentUserId.value)
      await loadGroups()
      activeGroupId.value = groupId
      await loadActiveGroupBooks()
      await loadActiveGroupMembers()
    } catch (err) { setError(err); throw err }
  }

  async function addMember(username: string) {
    if (!activeGroupId.value) throw new Error('No active group.')
    clearError()
    try {
      await groupShelvesApi.addMemberByUsername(activeGroupId.value, username)
      await loadGroups()
      await loadActiveGroupMembers()
    } catch (err) { setError(err); throw err }
  }

  async function removeMember(targetUserId: number) {
    if (!activeGroupId.value) throw new Error('No active group.')
    clearError()
    try {
      await groupShelvesApi.removeMember(activeGroupId.value, targetUserId)
      await loadGroups()
      await loadActiveGroupMembers()
      await loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  async function promoteToAdmin(targetUserId: number) {
    if (!activeGroupId.value) throw new Error('No active group.')
    clearError()
    try {
      await groupShelvesApi.promoteToAdmin(activeGroupId.value, targetUserId)
      await loadGroups()
      await loadActiveGroupMembers()
    } catch (err) { setError(err); throw err }
  }

  async function addBookToActiveGroup(book: Book, note: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      await groupShelvesApi.addGroupBook(activeGroupId.value, book.id)
      await loadGroups()
      await loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  async function removeActiveGroupBook(groupBookId: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      await groupShelvesApi.removeGroupBook(activeGroupId.value, groupBookId)
      await loadGroups()
      await loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  watch(currentUserId, () => { refresh() }, { immediate: true })

  return {
    groups, activeGroupId, activeGroup, activeGroupBooks, activeGroupMembers,
    joinedGroups, error, isActiveGroupAdmin, currentUsername,
    refresh, selectGroup, createGroup, joinGroup, addMember,
    removeMember, promoteToAdmin,
    addBookToActiveGroup, removeActiveGroupBook,
    clearError,
  }
})

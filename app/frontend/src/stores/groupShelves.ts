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

  const currentUsername = computed(() => auth.user?.username ?? null)
  const joinedGroups = computed(() => groups.value.filter((g) => g.isJoined))
  const activeGroup = computed(() => groups.value.find((g) => g.id === activeGroupId.value) ?? null)
  const isActiveGroupAdmin = computed(
    () => activeGroup.value?.currentUserRole === 'admin',
  )

  function clearError() { error.value = null }
  function setError(err: unknown) {
    error.value = err instanceof Error ? err.message : 'Something went wrong.'
  }

  function loadGroups() {
    groups.value = groupShelvesApi.listGroups(currentUsername.value)
    if (!groups.value.length) { activeGroupId.value = null; activeGroupBooks.value = []; return }
    const hasActive = activeGroupId.value && groups.value.some((g) => g.id === activeGroupId.value)
    if (!hasActive) activeGroupId.value = joinedGroups.value[0]?.id ?? groups.value[0]?.id ?? null
  }

  function loadActiveGroupBooks() {
    if (!activeGroupId.value) { activeGroupBooks.value = []; return }
    activeGroupBooks.value = groupShelvesApi.listGroupBooks(activeGroupId.value)
  }

  function loadActiveGroupMembers() {
    if (!activeGroupId.value) { activeGroupMembers.value = []; return }
    activeGroupMembers.value = groupShelvesApi.listGroupMembers(activeGroupId.value)
  }

  function refresh() {
    loadGroups()
    loadActiveGroupBooks()
    loadActiveGroupMembers()
  }

  function selectGroup(groupId: string) {
    clearError()
    activeGroupId.value = groupId
    loadActiveGroupBooks()
    loadActiveGroupMembers()
  }

  function createGroup(name: string, description: string) {
    clearError()
    try {
      const group = groupShelvesApi.createGroup(name, description, currentUsername.value)
      loadGroups()
      activeGroupId.value = group.id
      loadActiveGroupBooks()
      loadActiveGroupMembers()
      return group
    } catch (err) { setError(err); throw err }
  }

  function joinGroup(groupId: string) {
    clearError()
    try {
      groupShelvesApi.joinGroup(groupId, currentUsername.value)
      loadGroups()
      activeGroupId.value = groupId
      loadActiveGroupBooks()
      loadActiveGroupMembers()
    } catch (err) { setError(err); throw err }
  }

  function removeMember(targetUsername: string) {
    if (!activeGroupId.value) throw new Error('No active group.')
    clearError()
    try {
      groupShelvesApi.removeMember(activeGroupId.value, targetUsername, currentUsername.value)
      loadGroups()
      loadActiveGroupMembers()
      loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  function promoteToAdmin(targetUsername: string) {
    if (!activeGroupId.value) throw new Error('No active group.')
    clearError()
    try {
      groupShelvesApi.promoteToAdmin(activeGroupId.value, targetUsername, currentUsername.value)
      loadGroups()
      loadActiveGroupMembers()
    } catch (err) { setError(err); throw err }
  }

  function addBookToActiveGroup(book: Book, note: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      const entry = groupShelvesApi.addGroupBook(activeGroupId.value, currentUsername.value, book, note)
      loadGroups(); loadActiveGroupBooks()
      return entry
    } catch (err) { setError(err); throw err }
  }

  function updateActiveGroupBook(groupBookId: string, note: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      const entry = groupShelvesApi.updateGroupBook(activeGroupId.value, groupBookId, currentUsername.value, note)
      loadGroups(); loadActiveGroupBooks()
      return entry
    } catch (err) { setError(err); throw err }
  }

  function removeActiveGroupBook(groupBookId: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      groupShelvesApi.removeGroupBook(activeGroupId.value, groupBookId, currentUsername.value)
      loadGroups(); loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  watch(currentUsername, refresh, { immediate: true })

  return {
    groups, activeGroupId, activeGroup, activeGroupBooks, activeGroupMembers,
    joinedGroups, error, isActiveGroupAdmin,
    refresh, selectGroup, createGroup, joinGroup,
    removeMember, promoteToAdmin,
    addBookToActiveGroup, updateActiveGroupBook, removeActiveGroupBook,
    clearError,
  }
})
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
  const isLoading = ref(false)
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
    isLoading.value = true
    try {
      const fetched = await groupShelvesApi.listGroups(currentUserId.value)
      groups.value = fetched

      if (!fetched.length) {
        activeGroupId.value = null
        activeGroupBooks.value = []
        return
      }
    } catch (err) {
      error.value = 'Failed to load groups'
    } finally {
      isLoading.value = false
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
    clearError()
    isLoading.value = true
    try {
      await loadGroups()
      if (activeGroupId.value) {
        await Promise.all([
          loadActiveGroupBooks(),
          loadActiveGroupMembers()
        ])
      }
    } catch (err) {
      setError(err)
    } finally {
      isLoading.value = false
    }
  }

  async function selectGroup(groupId: string) {
    if (activeGroupId.value === groupId && activeGroupBooks.value.length && activeGroupMembers.value.length) {
      return
    }
    clearError()
    activeGroupId.value = groupId
    isLoading.value = true
    try {
      await Promise.all([
        loadActiveGroupBooks(),
        loadActiveGroupMembers()
      ])
    } catch (err) {
      setError(err)
    } finally {
      isLoading.value = false
    }
  }

  function setActiveGroupId(groupId: string | null) {
    activeGroupId.value = groupId
  }

    async function createGroup(name: string, description: string) {
        if (!currentUserId.value) throw new Error('Sign in to create a group.')
        clearError()
        try {
            const result = await groupShelvesApi.createGroup(name, description)
            await loadGroups()
            activeGroupId.value = result.id
            await loadActiveGroupBooks()
            await loadActiveGroupMembers()
            return result
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function joinGroup(groupId: string) {
        if (!currentUserId.value) throw new Error('Sign in to join a group.')
        clearError()
        try {
            await groupShelvesApi.joinGroup(groupId)
            await loadGroups()
            activeGroupId.value = groupId
            await loadActiveGroupBooks()
            await loadActiveGroupMembers()
        } catch (err) {
            setError(err)
            throw err
        }
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
      await groupShelvesApi.addGroupBook(activeGroupId.value, book.id, note)
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

  async function updateActiveGroupBook(groupBookId: string, note: string) {
    if (!activeGroupId.value) { const e = new Error('Choose a group first.'); setError(e); throw e }
    clearError()
    try {
      await groupShelvesApi.updateGroupBook(activeGroupId.value, groupBookId, note)
      await loadGroups()
      await loadActiveGroupBooks()
    } catch (err) { setError(err); throw err }
  }

  watch(currentUserId, () => { refresh() }, { immediate: true })

  return {
    groups, activeGroupId, activeGroup, activeGroupBooks, activeGroupMembers,
    joinedGroups, error, isLoading, isActiveGroupAdmin, currentUsername,
    refresh, selectGroup, setActiveGroupId, createGroup, joinGroup, addMember,
    removeMember, promoteToAdmin,
    addBookToActiveGroup, removeActiveGroupBook, updateActiveGroupBook,
    clearError,
  }
})

import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Book } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import {
  groupShelvesApi,
  type GroupBookEntry,
  type GroupSummary,
} from '@/services/groupShelvesApi'

export type { GroupBookEntry, GroupSummary } from '@/services/groupShelvesApi'

export const useGroupShelvesStore = defineStore('groupShelves', () => {
  const auth = useAuthStore()

  const groups = ref<GroupSummary[]>([])
  const activeGroupId = ref<string | null>(null)
  const activeGroupBooks = ref<GroupBookEntry[]>([])
  const error = ref<string | null>(null)

  const currentUsername = computed(() => auth.user?.username ?? null)
  const joinedGroups = computed(() => groups.value.filter((group) => group.isJoined))
  const activeGroup = computed(
    () => groups.value.find((group) => group.id === activeGroupId.value) ?? null,
  )

  function clearError() {
    error.value = null
  }

  function setError(err: unknown) {
    error.value = err instanceof Error ? err.message : 'Something went wrong.'
  }

  function loadGroups() {
    groups.value = groupShelvesApi.listGroups(currentUsername.value)

    if (!groups.value.length) {
      activeGroupId.value = null
      activeGroupBooks.value = []
      return
    }

    const hasActiveSelection = activeGroupId.value
      && groups.value.some((group) => group.id === activeGroupId.value)

    if (!hasActiveSelection) {
      activeGroupId.value = joinedGroups.value[0]?.id ?? groups.value[0]?.id ?? null
    }
  }

  function loadActiveGroupBooks() {
    if (!activeGroupId.value) {
      activeGroupBooks.value = []
      return
    }

    activeGroupBooks.value = groupShelvesApi.listGroupBooks(activeGroupId.value)
  }

  function refresh() {
    loadGroups()
    loadActiveGroupBooks()
  }

  function selectGroup(groupId: string) {
    clearError()
    activeGroupId.value = groupId
    loadActiveGroupBooks()
  }

  function joinGroup(groupId: string) {
    clearError()

    try {
      groupShelvesApi.joinGroup(groupId, currentUsername.value)
      loadGroups()
      activeGroupId.value = groupId
      loadActiveGroupBooks()
    } catch (err) {
      setError(err)
      throw err
    }
  }

  function addBookToActiveGroup(book: Book, note: string) {
    if (!activeGroupId.value) {
      const err = new Error('Choose a group first.')
      setError(err)
      throw err
    }

    clearError()

    try {
      const entry = groupShelvesApi.addGroupBook(activeGroupId.value, currentUsername.value, book, note)
      loadGroups()
      loadActiveGroupBooks()
      return entry
    } catch (err) {
      setError(err)
      throw err
    }
  }

  function updateActiveGroupBook(groupBookId: string, note: string) {
    if (!activeGroupId.value) {
      const err = new Error('Choose a group first.')
      setError(err)
      throw err
    }

    clearError()

    try {
      const entry = groupShelvesApi.updateGroupBook(
        activeGroupId.value,
        groupBookId,
        currentUsername.value,
        note,
      )
      loadGroups()
      loadActiveGroupBooks()
      return entry
    } catch (err) {
      setError(err)
      throw err
    }
  }

  function removeActiveGroupBook(groupBookId: string) {
    if (!activeGroupId.value) {
      const err = new Error('Choose a group first.')
      setError(err)
      throw err
    }

    clearError()

    try {
      groupShelvesApi.removeGroupBook(activeGroupId.value, groupBookId, currentUsername.value)
      loadGroups()
      loadActiveGroupBooks()
    } catch (err) {
      setError(err)
      throw err
    }
  }

  watch(currentUsername, refresh, { immediate: true })

  return {
    groups,
    activeGroupId,
    activeGroup,
    activeGroupBooks,
    joinedGroups,
    error,
    refresh,
    selectGroup,
    joinGroup,
    addBookToActiveGroup,
    updateActiveGroupBook,
    removeActiveGroupBook,
    clearError,
  }
})
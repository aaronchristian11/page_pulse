import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Book } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import {
    groupShelvesApi,
    type GroupSummary,
    type GroupMember,
} from '@/services/groupShelvesApi'

export type { GroupSummary, GroupMember } from '@/services/groupShelvesApi'

export const useGroupShelvesStore = defineStore('groupShelves', () => {
    const auth = useAuthStore()

    const groups = ref<GroupSummary[]>([])
    const activeGroupId = ref<string | null>(null)
    const error = ref<string | null>(null)
    const isLoading = ref(false)

    const currentUserId = computed(() => auth.user?.id ?? null)
    const currentUsername = computed(() => auth.user?.username ?? null)
    const joinedGroups = computed(() => groups.value.filter((g) => g.isJoined))
    const activeGroup = computed(() => groups.value.find((g) => g.id === activeGroupId.value) ?? null)
    const activeGroupBooks = computed(() => activeGroup.value?.books ?? [])
    const activeGroupMembers = computed(() => activeGroup.value?.members ?? [])
    const isActiveGroupAdmin = computed(() => activeGroup.value?.currentUserRole === 'Administrator')

    function clearError() { error.value = null }

    function setError(err: unknown) {
        error.value = err instanceof Error ? err.message : 'Something went wrong.'
    }

    async function loadGroups() {
        isLoading.value = true;
        try {
            groups.value = await groupShelvesApi.listGroups(currentUserId.value)

            if (!groups.value.length) {
                activeGroupId.value = null
                return
            }

            const hasActive = activeGroupId.value && groups.value.some((g) => g.id === activeGroupId.value)
            if (!hasActive) {
                activeGroupId.value = groups.value.find((g) => g.isJoined)?.id ?? groups.value[0]?.id ?? null
            }
        } catch (err) {
            setError(err)
        } finally {
            isLoading.value = false;
        }
    }

    function selectGroup(groupId: string) {
        clearError()
        activeGroupId.value = groupId
    }

    async function createGroup(name: string, description: string) {
        if (!currentUserId.value) throw new Error('Sign in to create a group.')
        clearError()
        try {
            const result = await groupShelvesApi.createGroup(name, description)
            await loadGroups()
            activeGroupId.value = result.id
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
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function addMember(username: string) {
        if (!activeGroupId.value) throw new Error('No active group.')
        clearError()
        try {
            const members = await groupShelvesApi.addMemberByUsername(activeGroupId.value, username)
            const group = groups.value.find(g => g.id === activeGroupId.value)
            if (group) {
                group.members = members
                group.memberCount = members.length
            }
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function removeMember(targetUserId: number) {
        if (!activeGroupId.value) throw new Error('No active group.')
        clearError()
        try {
            const members = await groupShelvesApi.removeMember(activeGroupId.value, targetUserId)
            const group = groups.value.find(g => g.id === activeGroupId.value)
            if (group) {
                group.members = members
                group.memberCount = members.length
            }
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function promoteToAdmin(targetUserId: number) {
        if (!activeGroupId.value) throw new Error('No active group.')
        clearError()
        try {
            const members = await groupShelvesApi.promoteToAdmin(activeGroupId.value, targetUserId)
            const group = groups.value.find(g => g.id === activeGroupId.value)
            if (group) group.members = members
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function addBookToActiveGroup(book: Book) {
        if (!activeGroupId.value) throw new Error('Choose a group first.')
        clearError()
        try {
            const books = await groupShelvesApi.addGroupBook(activeGroupId.value, book.id)
            const group = groups.value.find(g => g.id === activeGroupId.value)
            if (group) {
                group.books = books
                group.bookCount = books.length
            }
        } catch (err) {
            setError(err)
            throw err
        }
    }

    async function removeActiveGroupBook(groupBookId: string) {
        if (!activeGroupId.value) throw new Error('Choose a group first.')
        clearError()
        try {
            const books = await groupShelvesApi.removeGroupBook(activeGroupId.value, groupBookId)
            const group = groups.value.find(g => g.id === activeGroupId.value)
            if (group) {
                group.books = books
                group.bookCount = books.length
            }
        } catch (err) {
            setError(err)
            throw err
        }
    }

    watch(() => currentUserId.value, (id) => {
        if (id) {
            loadGroups()
        }
    }, { immediate: true })

    return {
        groups, activeGroupId, activeGroup, activeGroupBooks, activeGroupMembers,
        joinedGroups, error, isActiveGroupAdmin, currentUsername, currentUserId,
        loadGroups, selectGroup, createGroup, joinGroup, addMember,
        removeMember, promoteToAdmin,
        addBookToActiveGroup, removeActiveGroupBook,
        clearError,
    }
})

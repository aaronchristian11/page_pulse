import type { Book } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'

const BASE = '/api'

function authHeaders() {
    const auth = useAuthStore()
    const userId = auth.user?.id

    if (!userId) {
        throw new Error('Sign in to continue.')
    }

    return {
        'Content-Type': 'application/json',
        'x-user-id': String(userId),
    }
}

export interface GroupSummary {
    id: string
    name: string
    description: string
    isJoined: boolean
    memberCount: number
    bookCount: number
    currentUserRole: 'admin' | 'member' | null
}

export interface GroupMember {
    id: number
    username: string
    role: 'admin' | 'member'
}

export interface GroupBookEntry {
    id: string
    groupId: string
    book: Book
    addedBy: string
    addedAt: string
    note: string
}

function optionalAuthHeaders(userIdOverride?: number | null) {
    const auth = useAuthStore()
    const userId = userIdOverride !== undefined ? userIdOverride : auth.user?.id
    if (!userId) return { 'Content-Type': 'application/json' }
    return {
        'Content-Type': 'application/json',
        'x-user-id': String(userId),
    }
}

export const groupShelvesApi = {
    async listGroups(userId?: number | null): Promise<GroupSummary[]> {
        const res = await fetch(`${BASE}/groups`, {
            headers: optionalAuthHeaders(userId),
        })
        const data = await res.json()
        const groups = data.groups ?? []
        return groups.map((g: any) => ({
            id: String(g.id),
            name: g.name,
            description: g.description ?? '',
            isJoined: g.isJoined ?? false,
            memberCount: g.memberCount ?? 0,
            bookCount: g.bookCount ?? 0,
            currentUserRole: g.currentUserRole ?? null,
            discoveryQuery: g.discovery_query ?? '',
        }))
    },

    async listGroupMembers(groupId: string): Promise<GroupMember[]> {
        const res = await fetch(`${BASE}/groups/${groupId}/members`, {
            headers: authHeaders(),
        })
        const data = await res.json()
        return (data.members ?? []).map((m: any) => ({
            id: m.id,
            username: m.username,
            role: m.role,
        }))
    },

    async listGroupBooks(groupId: string): Promise<GroupBookEntry[]> {
        const res = await fetch(`${BASE}/groups/${groupId}/books`, {
            headers: authHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load books.')
        return data.books ?? []
    },

    async createGroup(name: string, description: string): Promise<{ id: string }> {
        const res = await fetch(`${BASE}/groups`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, description }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create group.')
        return { id: String(data.id) }
    },

    async joinGroup(groupId: string): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/join`, {
            method: 'POST',
            headers: authHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to join group.')
    },

    async addMemberByUsername(groupId: string, username: string): Promise<void> {
        const lookupRes = await fetch(
            `${BASE}/users/lookup?username=${encodeURIComponent(username)}`,
            {
                headers: authHeaders(),
            },
        )
        const lookupData = await lookupRes.json()
        if (!lookupRes.ok) throw new Error(lookupData.error ?? 'User not found.')
        const userId = lookupData.user.id

        const res = await fetch(`${BASE}/groups/${groupId}/join`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ user_id: userId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to add member.')
    },

    async removeMember(groupId: string, userId: number): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to remove member.')
    },

    async promoteToAdmin(groupId: string, userId: number): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/members/${userId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ role: 'admin' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to promote member.')
    },

    async addGroupBook(groupId: string, bookId: string, note?: string): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/books`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ book_id: bookId, note }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to add book.')
    },

    async updateGroupBook(groupId: string, bookId: string, note: string): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/books/${bookId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ note }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update book.')
    },

    async removeGroupBook(groupId: string, bookId: string): Promise<void> {
        const res = await fetch(`${BASE}/groups/${groupId}/books/${bookId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to remove book.')
    },
}

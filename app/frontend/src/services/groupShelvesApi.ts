import type { Book } from '@/stores/books'

const BASE = '/api'

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

export const groupShelvesApi = {
  async listGroups(userId?: number | null): Promise<GroupSummary[]> {
    const res = await fetch(`${BASE}/groups`)
    const data = await res.json()
    const groups = data.groups ?? []
    return groups.map((g: any) => ({
      id: String(g.id),
      name: g.name,
      description: g.description ?? '',
      isJoined: false,
      memberCount: 0,
      bookCount: 0,
      currentUserRole: null,
    }))
  },

  async listGroupMembers(groupId: string): Promise<GroupMember[]> {
    const res = await fetch(`${BASE}/groups/${groupId}/members`)
    const data = await res.json()
    return (data.members ?? []).map((m: any) => ({
      id: m.id,
      username: m.username,
      role: m.role,
    }))
  },

  async listGroupBooks(groupId: string): Promise<GroupBookEntry[]> {
    const res = await fetch(`${BASE}/groups/${groupId}/books`)
    const data = await res.json()
    return data.books ?? []
  },

  async createGroup(name: string, description: string, userId: number): Promise<{ id: string }> {
    const res = await fetch(`${BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, user_id: userId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to create group.')
    return { id: String(data.id) }
  },

  async joinGroup(groupId: string, userId: number): Promise<void> {
    const res = await fetch(`${BASE}/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to join group.')
  },

  async addMemberByUsername(groupId: string, username: string): Promise<void> {
    // Look up the user's ID by username first
    const lookupRes = await fetch(`${BASE}/users/lookup?username=${encodeURIComponent(username)}`)
    const lookupData = await lookupRes.json()
    if (!lookupRes.ok) throw new Error(lookupData.error ?? 'User not found.')
    const userId = lookupData.user.id

    const res = await fetch(`${BASE}/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to add member.')
  },

  async removeMember(groupId: string, userId: number): Promise<void> {
    const res = await fetch(`${BASE}/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to remove member.')
  },

  async promoteToAdmin(groupId: string, userId: number): Promise<void> {
    const res = await fetch(`${BASE}/groups/${groupId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to promote member.')
  },

  async addGroupBook(groupId: string, bookId: string): Promise<void> {
    const res = await fetch(`${BASE}/groups/${groupId}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to add book.')
  },

  async removeGroupBook(groupId: string, bookId: string): Promise<void> {
    const res = await fetch(`${BASE}/groups/${groupId}/books/${bookId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to remove book.')
  },
}
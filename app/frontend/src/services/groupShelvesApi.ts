import type { Book } from '@/stores/books'

const STORAGE_KEY = 'page-pulse-group-shelves-v2'

export interface GroupDefinition {
  id: string
  name: string
  description: string
  discoveryQuery: string
  createdBy: string
}

export interface GroupSummary extends GroupDefinition {
  isJoined: boolean
  memberCount: number
  bookCount: number
  currentUserRole: 'admin' | 'member' | null
}

export interface GroupMember {
  username: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface GroupBookEntry {
  id: string
  groupId: string
  book: Book
  addedBy: string
  addedAt: string
  note: string
}

interface GroupMembershipRecord {
  groupId: string
  username: string
  role: 'admin' | 'member'
  joinedAt: string
}

interface StoredState {
  groups: GroupDefinition[]
  memberships: GroupMembershipRecord[]
  books: GroupBookEntry[]
}

const defaultGroups: GroupDefinition[] = [
  {
    id: 'fiction',
    name: 'Fiction',
    description: 'Character-driven novels, page-turners, and immersive stories worth passing around.',
    discoveryQuery: 'fiction',
    createdBy: 'system',
  },
  {
    id: 'non-fiction',
    name: 'Non-fiction',
    description: 'Biographies, history, science, and practical books members want the group to discover.',
    discoveryQuery: 'non-fiction',
    createdBy: 'system',
  },
]

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createDefaultState(): StoredState {
  return { groups: cloneState(defaultGroups), memberships: [], books: [] }
}

function normalizeState(raw: Partial<StoredState> | null | undefined): StoredState {
  if (!raw) return createDefaultState()
  const storedGroups = Array.isArray(raw.groups) ? raw.groups : []
  const groupIds = new Set(defaultGroups.map((g) => g.id))
  const mergedGroups = [...defaultGroups, ...storedGroups.filter((g) => !groupIds.has(g.id))]
  return {
    groups: cloneState(mergedGroups),
    memberships: Array.isArray(raw.memberships) ? raw.memberships : [],
    books: Array.isArray(raw.books) ? raw.books : [],
  }
}

function readState(): StoredState {
  if (typeof window === 'undefined') return createDefaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) { const s = createDefaultState(); writeState(s); return s }
    const normalized = normalizeState(JSON.parse(raw) as Partial<StoredState>)
    writeState(normalized)
    return normalized
  } catch {
    const reset = createDefaultState(); writeState(reset); return reset
  }
}

function writeState(state: StoredState) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function requireUsername(username: string | null | undefined): string {
  if (!username) throw new Error('Sign in to manage group shelves.')
  return username
}

function requireGroup(state: StoredState, groupId: string): GroupDefinition {
  const group = state.groups.find((g) => g.id === groupId)
  if (!group) throw new Error('Group not found.')
  return group
}

function ensureMembership(state: StoredState, groupId: string, username: string) {
  if (!state.memberships.some((m) => m.groupId === groupId && m.username === username))
    throw new Error('Join this group before recommending books.')
}

function requireAdmin(state: StoredState, groupId: string, username: string) {
  const m = state.memberships.find((m) => m.groupId === groupId && m.username === username)
  if (!m || m.role !== 'admin') throw new Error('Only admins can perform this action.')
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const groupShelvesApi = {
  listGroups(username?: string | null): GroupSummary[] {
    const state = readState()
    return state.groups.map((group) => {
      const membership = username
        ? state.memberships.find((m) => m.groupId === group.id && m.username === username)
        : null
      return {
        ...group,
        isJoined: !!membership,
        currentUserRole: (membership?.role ?? null) as 'admin' | 'member' | null,
        memberCount: state.memberships.filter((m) => m.groupId === group.id).length,
        bookCount: state.books.filter((b) => b.groupId === group.id).length,
      }
    })
  },

  listGroupMembers(groupId: string): GroupMember[] {
    const state = readState()
    requireGroup(state, groupId)
    return state.memberships
      .filter((m) => m.groupId === groupId)
      .map((m) => ({ username: m.username, role: m.role, joinedAt: m.joinedAt }))
      .sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1
        if (b.role === 'admin' && a.role !== 'admin') return 1
        return Date.parse(a.joinedAt) - Date.parse(b.joinedAt)
      })
  },

  listGroupBooks(groupId: string): GroupBookEntry[] {
    const state = readState()
    requireGroup(state, groupId)
    return state.books
      .filter((b) => b.groupId === groupId)
      .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
      .map((b) => cloneState(b))
  },

  createGroup(name: string, description: string, username: string | null | undefined): GroupSummary {
    const state = readState()
    const memberUsername = requireUsername(username)
    const id = createId('group')
    const group: GroupDefinition = {
      id, name: name.trim(), description: description.trim(),
      discoveryQuery: name.toLowerCase().trim(), createdBy: memberUsername,
    }
    state.groups.push(group)
    state.memberships.push({ groupId: id, username: memberUsername, role: 'admin', joinedAt: new Date().toISOString() })
    writeState(state)
    return { ...group, isJoined: true, currentUserRole: 'admin', memberCount: 1, bookCount: 0 }
  },

  joinGroup(groupId: string, username: string | null | undefined) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    if (state.memberships.some((m) => m.groupId === groupId && m.username === memberUsername))
      throw new Error('You already joined this group.')
    state.memberships.push({ groupId, username: memberUsername, role: 'member', joinedAt: new Date().toISOString() })
    writeState(state)
  },

  removeMember(groupId: string, targetUsername: string, requesterUsername: string | null | undefined) {
    const state = readState()
    const requester = requireUsername(requesterUsername)
    requireGroup(state, groupId)
    requireAdmin(state, groupId, requester)
    const target = state.memberships.find((m) => m.groupId === groupId && m.username === targetUsername)
    if (!target) throw new Error('Member not found.')
    if (target.username === requester) throw new Error('You cannot remove yourself.')
    state.memberships = state.memberships.filter((m) => !(m.groupId === groupId && m.username === targetUsername))
    state.books = state.books.filter((b) => !(b.groupId === groupId && b.addedBy === targetUsername))
    writeState(state)
  },

  promoteToAdmin(groupId: string, targetUsername: string, requesterUsername: string | null | undefined) {
    const state = readState()
    const requester = requireUsername(requesterUsername)
    requireGroup(state, groupId)
    requireAdmin(state, groupId, requester)
    const target = state.memberships.find((m) => m.groupId === groupId && m.username === targetUsername)
    if (!target) throw new Error('Member not found.')
    const currentAdmin = state.memberships.find((m) => m.groupId === groupId && m.username === requester)
    if (currentAdmin) currentAdmin.role = 'member'
    target.role = 'admin'
    writeState(state)
  },

  addGroupBook(groupId: string, username: string | null | undefined, book: Book, note: string) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    ensureMembership(state, groupId, memberUsername)
    const existingBook = state.books.find((b) => b.groupId === groupId && b.book.id === book.id)
    if (existingBook) {
      if (existingBook.addedBy === memberUsername) throw new Error('You already recommended this book here.')
      throw new Error(`This book was already recommended by ${existingBook.addedBy}.`)
    }
    const entry: GroupBookEntry = {
      id: createId('group-book'), groupId, book: cloneState(book),
      addedBy: memberUsername, addedAt: new Date().toISOString(), note: note.trim(),
    }
    state.books.push(entry)
    writeState(state)
    return cloneState(entry)
  },

  updateGroupBook(groupId: string, groupBookId: string, username: string | null | undefined, note: string) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    ensureMembership(state, groupId, memberUsername)
    const entry = state.books.find((b) => b.groupId === groupId && b.id === groupBookId)
    if (!entry) throw new Error('Recommendation not found.')
    if (entry.addedBy !== memberUsername) throw new Error('You can only update books you recommended.')
    entry.note = note.trim()
    writeState(state)
    return cloneState(entry)
  },

  removeGroupBook(groupId: string, groupBookId: string, username: string | null | undefined) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    ensureMembership(state, groupId, memberUsername)
    const entry = state.books.find((b) => b.groupId === groupId && b.id === groupBookId)
    if (!entry) throw new Error('Recommendation not found.')
    const membership = state.memberships.find((m) => m.groupId === groupId && m.username === memberUsername)
    if (membership?.role !== 'admin' && entry.addedBy !== memberUsername)
      throw new Error('You can only remove books you recommended.')
    state.books = state.books.filter((b) => b.id !== groupBookId)
    writeState(state)
  },
}

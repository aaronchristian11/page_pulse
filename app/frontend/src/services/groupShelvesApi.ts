import type { Book } from '@/stores/books'

const STORAGE_KEY = 'page-pulse-group-shelves-v1'

export interface GroupDefinition {
  id: string
  name: string
  description: string
  discoveryQuery: string
}

export interface GroupSummary extends GroupDefinition {
  isJoined: boolean
  memberCount: number
  bookCount: number
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
    discoveryQuery: '',
  },
  {
    id: 'non-fiction',
    name: 'Non-fiction',
    description: 'Biographies, history, science, and practical books members want the group to discover.',
    discoveryQuery: '',
  },
]

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createDefaultState(): StoredState {
  return {
    groups: cloneState(defaultGroups),
    memberships: [],
    books: [],
  }
}

function normalizeState(raw: Partial<StoredState> | null | undefined): StoredState {
  const defaultState = createDefaultState()

  if (!raw) {
    return defaultState
  }

  const storedGroups = Array.isArray(raw.groups) ? raw.groups : []
  const groupIds = new Set(defaultGroups.map((group) => group.id))
  const mergedGroups = [
    ...defaultGroups,
    ...storedGroups.filter((group) => !groupIds.has(group.id)),
  ]

  return {
    groups: cloneState(mergedGroups),
    memberships: Array.isArray(raw.memberships) ? raw.memberships : [],
    books: Array.isArray(raw.books) ? raw.books : [],
  }
}

function readState(): StoredState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = createDefaultState()
      writeState(seeded)
      return seeded
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>
    const normalized = normalizeState(parsed)
    writeState(normalized)
    return normalized
  } catch {
    const reset = createDefaultState()
    writeState(reset)
    return reset
  }
}

function writeState(state: StoredState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function requireUsername(username: string | null | undefined): string {
  if (!username) {
    throw new Error('Sign in to manage group shelves.')
  }

  return username
}

function requireGroup(state: StoredState, groupId: string): GroupDefinition {
  const group = state.groups.find((entry) => entry.id === groupId)
  if (!group) {
    throw new Error('Group not found.')
  }

  return group
}

function ensureMembership(state: StoredState, groupId: string, username: string) {
  const isMember = state.memberships.some(
    (membership) => membership.groupId === groupId && membership.username === username,
  )

  if (!isMember) {
    throw new Error('Join this group before recommending books.')
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const groupShelvesApi = {
  listGroups(username?: string | null): GroupSummary[] {
    const state = readState()

    return state.groups.map((group) => ({
      ...group,
      isJoined: !!username && state.memberships.some(
        (membership) => membership.groupId === group.id && membership.username === username,
      ),
      memberCount: state.memberships.filter((membership) => membership.groupId === group.id).length,
      bookCount: state.books.filter((book) => book.groupId === group.id).length,
    }))
  },

  listGroupBooks(groupId: string): GroupBookEntry[] {
    const state = readState()
    requireGroup(state, groupId)

    return state.books
      .filter((book) => book.groupId === groupId)
      .sort((left, right) => Date.parse(right.addedAt) - Date.parse(left.addedAt))
      .map((book) => cloneState(book))
  },

  joinGroup(groupId: string, username: string | null | undefined) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)

    const existingMembership = state.memberships.find(
      (membership) => membership.groupId === groupId && membership.username === memberUsername,
    )

    if (existingMembership) {
      throw new Error('You already joined this group.')
    }

    state.memberships.push({
      groupId,
      username: memberUsername,
      joinedAt: new Date().toISOString(),
    })

    writeState(state)
  },

  addGroupBook(groupId: string, username: string | null | undefined, book: Book, note: string) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    ensureMembership(state, groupId, memberUsername)

    const existingBook = state.books.find(
      (entry) => entry.groupId === groupId && entry.book.id === book.id,
    )

    if (existingBook) {
      if (existingBook.addedBy === memberUsername) {
        throw new Error('You already recommended this book here.')
      }

      throw new Error(`This book was already recommended by ${existingBook.addedBy}.`)
    }

    const entry: GroupBookEntry = {
      id: createId('group-book'),
      groupId,
      book: cloneState(book),
      addedBy: memberUsername,
      addedAt: new Date().toISOString(),
      note: note.trim(),
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

    const entry = state.books.find((book) => book.groupId === groupId && book.id === groupBookId)
    if (!entry) {
      throw new Error('Recommendation not found.')
    }

    if (entry.addedBy !== memberUsername) {
      throw new Error('You can only update books you recommended.')
    }

    entry.note = note.trim()
    writeState(state)

    return cloneState(entry)
  },

  removeGroupBook(groupId: string, groupBookId: string, username: string | null | undefined) {
    const state = readState()
    const memberUsername = requireUsername(username)
    requireGroup(state, groupId)
    ensureMembership(state, groupId, memberUsername)

    const entry = state.books.find((book) => book.groupId === groupId && book.id === groupBookId)
    if (!entry) {
      throw new Error('Recommendation not found.')
    }

    if (entry.addedBy !== memberUsername) {
      throw new Error('You can only remove books you recommended.')
    }

    state.books = state.books.filter((book) => book.id !== groupBookId)
    writeState(state)
  },
}
import axios from 'axios';
import type { Book } from '@/stores/books';

const BASE = '/api';

export interface GroupSummary {
    id: string;
    name: string;
    description: string;
    isJoined: boolean;
    memberCount: number;
    bookCount: number;
    currentUserRole: 'admin' | 'member' | null;
}

export interface GroupMember {
    id: number;
    username: string;
    role: 'admin' | 'member';
}

export interface GroupBookEntry {
    id: string;
    groupId: string;
    book: Book;
    addedBy: string;
    addedAt: string;
    note: string;
}

export const groupShelvesApi = {
    async listGroups(userId?: number | null): Promise<GroupSummary[]> {
        try {
            const { data } = await axios.get(`${BASE}/groups`);
            const groups = data.groups ?? [];

            return groups.map((g: any) => ({
                id: String(g.id),
                name: g.name,
                description: g.description ?? '',
                isJoined: false,
                memberCount: 0,
                bookCount: 0,
                currentUserRole: null,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to fetch groups.');
        }
    },

    async listGroupMembers(groupId: string): Promise<GroupMember[]> {
        try {
            const { data } = await axios.get(`${BASE}/groups/${groupId}/members`);

            return (data.members ?? []).map((m: any) => ({
                id: m.id,
                username: m.username,
                role: m.role,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to fetch members.');
        }
    },

    async listGroupBooks(groupId: string): Promise<GroupBookEntry[]> {
        try {
            const { data } = await axios.get(`${BASE}/groups/${groupId}/books`);
            return data.books ?? [];
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to fetch books.');
        }
    },

    async createGroup(name: string, description: string, userId: number): Promise<{ id: string }> {
        try {
            const { data } = await axios.post(`${BASE}/groups/create`, {
                name,
                description,
            });

            return { id: String(data.id) };
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to create group.');
        }
    },

    async joinGroup(groupId: string, userId: number): Promise<void> {
        try {
            await axios.post(`${BASE}/groups/${groupId}/join`);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to join group.');
        }
    },

    async addMemberByUsername(groupId: string, username: string): Promise<void> {
        try {
            // Lookup user
            const { data: lookupData } = await axios.get(
                `${BASE}/users/lookup`,
                { params: { username } }
            );

            const userId = lookupData.user.id;

            await axios.post(`${BASE}/groups/${groupId}/join`, {
                user_id: userId,
            });
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to add member.');
        }
    },

    async removeMember(groupId: string, userId: number): Promise<void> {
        try {
            await axios.delete(`${BASE}/groups/${groupId}/members/${userId}`);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to remove member.');
        }
    },

    async promoteToAdmin(groupId: string, userId: number): Promise<void> {
        try {
            await axios.put(`${BASE}/groups/${groupId}/members/${userId}`, {
                role: 'admin',
            });
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to promote member.');
        }
    },

    async addGroupBook(groupId: string, bookId: string): Promise<void> {
        try {
            await axios.post(`${BASE}/groups/${groupId}/books`, {
                book_id: bookId,
            });
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to add book.');
        }
    },

    async removeGroupBook(groupId: string, bookId: string): Promise<void> {
        try {
            await axios.delete(`${BASE}/groups/${groupId}/books/${bookId}`);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to remove book.');
        }
    },
};

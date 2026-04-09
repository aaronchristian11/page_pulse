import axios from 'axios';
import { type Book, toBook, normalizeKey } from '@/stores/books';

const BASE = '/api';

export interface GroupSummary {
    id: string;
    name: string;
    description: string;
    isJoined: boolean;
    memberCount: number;
    bookCount: number;
    currentUserRole: 'Administrator' | 'General' | null;
    members: GroupMember[];
    books: Book[];
}

export interface GroupMember {
    id: number;
    username: string;
    role: 'Administrator' | 'General';
}

export const groupShelvesApi = {
    async listGroups(currentUserId?: number | null): Promise<GroupSummary[]> {
        try {
            const { data } = await axios.get(`${BASE}/groups`);
            const groups = data.groups ?? [];

            return groups.map((g: any) => ({
                id: String(g.id),
                name: g.name,
                description: g.description ?? '',
                members: (g.members ?? []).map((m: any) => ({
                    id: m.id,
                    username: m.username,
                    role: m.role,
                })),
                books: (g.books ?? []).map(toBook),
                isJoined: (g.members ?? []).some((m: any) => m.id === currentUserId),
                currentUserRole: (g.members ?? []).find((m: any) => m.id === currentUserId)?.role ?? null,
                memberCount: g.members?.length ?? 0,
                bookCount: g.books?.length ?? 0,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to fetch groups.');
        }
    },

    async createGroup(name: string, description: string): Promise<{ id: string }> {
        try {
            const { data } = await axios.post(`${BASE}/groups/create`, { name, description });
            return { id: String(data.id) };
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to create group.');
        }
    },

    async joinGroup(groupId: number): Promise<void> {
        try {
            await axios.post(`${BASE}/groups/${groupId}/join`);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to join group.');
        }
    },

    async addMemberByUsername(groupId: string, username: string): Promise<GroupMember[]> {
        try {
            const { data: lookupData } = await axios.get(`${BASE}/users/lookup`, { params: { username } });
            const user = lookupData.user;
            const { data } = await axios.post(`${BASE}/groups/${groupId}/join`, { user: user });
            return (data.members ?? []).map((m: any) => ({
                id: m.id,
                username: m.username,
                role: m.role,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to add member.');
        }
    },

    async removeMember(groupId: string, userId: number): Promise<GroupMember[]> {
        try {
            const { data } = await axios.delete(`${BASE}/groups/${groupId}/members/${userId}`);
            return (data.members ?? []).map((m: any) => ({
                id: m.id,
                username: m.username,
                role: m.role,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to remove member.');
        }
    },

    async promoteToAdmin(groupId: string, userId: number): Promise<GroupMember[]> {
        try {
            const { data } = await axios.put(`${BASE}/groups/${groupId}/members/${userId}`, {
                role_permission_id: 1, // Administrator - Manage groups
            });
            return (data.members ?? []).map((m: any) => ({
                id: m.id,
                username: m.username,
                role: m.role,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to promote member.');
        }
    },

    async addGroupBook(groupId: string, bookId: string): Promise<Book[]> {
        try {
            const { data } = await axios.post(`${BASE}/groups/${groupId}/books`, { book_id: bookId });
            return (data.books ?? []).map(toBook);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to add book.');
        }
    },

    async removeGroupBook(groupId: string, bookId: string): Promise<Book[]> {
        try {
            const { data } = await axios.delete(`${BASE}/groups/${groupId}/books/${bookId}`);
            return (data.books ?? []).map(toBook);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to remove book.');
        }
    },
};

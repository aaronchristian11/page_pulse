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
    currentUserRole: 'Administrator' | 'General' | null;
    members: GroupMember[];
    books: GroupBookEntry[];
}

export interface GroupMember {
    id: number;
    username: string;
    role: 'Administrator' | 'General';
}

export interface GroupBookEntry {
    id: string;
    key: string;
    addedBy: string;
    addedByUserId: number;
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
                books: (g.books ?? []).map((b: any) => ({
                    id: String(b.id),
                    key: b.key,
                    addedBy: `${b.first_name} ${b.last_name}`,
                    addedByUserId: b.user_id,
                })),
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

    async joinGroup(groupId: string): Promise<void> {
        try {
            await axios.post(`${BASE}/groups/${groupId}/join`);
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to join group.');
        }
    },

    async addMemberByUsername(groupId: string, username: string): Promise<GroupMember[]> {
        try {
            const { data: lookupData } = await axios.get(`${BASE}/users/lookup`, { params: { username } });
            const userId = lookupData.user.id;
            const { data } = await axios.post(`${BASE}/groups/${groupId}/join`, { user_id: userId });
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

    async addGroupBook(groupId: string, bookId: string): Promise<GroupBookEntry[]> {
        try {
            const { data } = await axios.post(`${BASE}/groups/${groupId}/books`, { book_id: bookId });
            return (data.books ?? []).map((b: any) => ({
                id: String(b.id),
                key: b.key,
                addedBy: `${b.first_name} ${b.last_name}`,
                addedByUserId: b.user_id,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to add book.');
        }
    },

    async removeGroupBook(groupId: string, bookId: string): Promise<GroupBookEntry[]> {
        try {
            const { data } = await axios.delete(`${BASE}/groups/${groupId}/books/${bookId}`);
            return (data.books ?? []).map((b: any) => ({
                id: String(b.id),
                key: b.key,
                addedBy: `${b.first_name} ${b.last_name}`,
                addedByUserId: b.user_id,
            }));
        } catch (error: any) {
            throw new Error(error?.response?.data?.error ?? 'Failed to remove book.');
        }
    },
};

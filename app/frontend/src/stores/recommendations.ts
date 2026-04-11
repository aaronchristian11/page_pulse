import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import {toBook} from "@/stores/books";

export interface InboxItem {
    id: number
    message: string | null
    is_read: boolean
    group_id: number | null
    created_at: string
    sender_username: string
    sender_first_name: string
    sender_last_name: string
    book_key: string
}

export const useRecommendationsStore = defineStore('recommendations', () => {
    const authStore = useAuthStore()

    const inbox = ref<InboxItem[]>([])
    const unreadCount = ref(0)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const unreadItems = computed(() => inbox.value.filter((i) => !i.is_read))

    async function loadInbox() {
        if (!authStore.user) return
        try {
            isLoading.value = true
            const res = await axios.get('/api/recommendations/inbox')
            inbox.value = res.data.inbox.map((item: any) =>
                item.type === 'recommendation' ? { ...item, ...toBook(item) } : item
            )
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load inbox.'
        } finally {
            isLoading.value = false
        }
    }

    async function loadUnreadCount() {
        if (!authStore.user) return
        try {
            const res = await axios.get('/api/recommendations/inbox/unread-count');
            unreadCount.value = res.data.unread
        } catch {
            // Silent fail — badge not critical
        }
    }

    async function markAsRead(id: number, type: string = 'recommendation') {
        try {
            await axios.patch(`/api/recommendations/${id}/read?type=${type}`)
            const item = inbox.value.find((i) => i.id === id)
            if (item) {
                item.is_read = true
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to mark as read.'
        }
    }

    async function sendRecommendation(bookKey: string, recipientId?: number, groupId?: number, message?: string) {
        try {
            await axios.post('/api/recommendations', {
                    book_key: bookKey,
                    recipient_id: recipientId ?? null,
                    group_id: groupId ?? null,
                    message: message ?? null,
                })
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to send recommendation.'
            throw err
        }
    }

    function clearError() {
        error.value = null
    }

    watch(authStore.user, () => {
        if (authStore.user) loadUnreadCount();
    }, {
        immediate: true
    });

    return {
        inbox,
        unreadCount,
        unreadItems,
        isLoading,
        error,
        loadInbox,
        loadUnreadCount,
        markAsRead,
        sendRecommendation,
        clearError,
    }
});

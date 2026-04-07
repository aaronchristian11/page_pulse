import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export interface FollowUser {
    id: number
    username: string
    first_name: string
    last_name: string
}

export interface FriendRecommendation {
    key: string
    book_id: number
    rating: number
    recommended_by: string
}

export const useFollowsStore = defineStore('follows', () => {
    const authStore = useAuthStore()

    const following = ref<FollowUser[]>([])
    const followers = ref<FollowUser[]>([])
    const friendRecommendations = ref<FriendRecommendation[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const isFollowing = computed(
        () => (userId: number) => following.value.some((u) => u.id === userId)
    )

    function authHeaders() {
        return { 'x-user-id': String(authStore.user?.id ?? '') }
    }

    async function loadFollowing() {
        if (!authStore.user) return
        try {
            isLoading.value = true
            const res = await axios.get('/api/follows/following', { headers: authHeaders() })
            following.value = res.data.following
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load following.'
        } finally {
            isLoading.value = false
        }
    }

    async function loadFollowers() {
        if (!authStore.user) return
        try {
            isLoading.value = true
            const res = await axios.get('/api/follows/followers', { headers: authHeaders() })
            followers.value = res.data.followers
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load followers.'
        } finally {
            isLoading.value = false
        }
    }

    async function followUser(userId: number) {
        try {
            await axios.post(`/api/follows/follow/${userId}`, {}, { headers: authHeaders() })
            await loadFollowing()
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to follow user.'
        }
    }

    async function unfollowUser(userId: number) {
        try {
            await axios.delete(`/api/follows/unfollow/${userId}`, { headers: authHeaders() })
            following.value = following.value.filter((u) => u.id !== userId)
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to unfollow user.'
        }
    }

    async function loadFriendRecommendations() {
        if (!authStore.user) return
        try {
            isLoading.value = true
            const res = await axios.get('/api/follows/friend-recommendations', {
                headers: authHeaders(),
            })
            friendRecommendations.value = res.data.recommendations
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load recommendations.'
        } finally {
            isLoading.value = false
        }
    }

    async function getFollowedUserShelf(userId: number) {
        try {
            const res = await axios.get(`/api/follows/${userId}/shelf`, { headers: authHeaders() })
            return res.data.books
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load shelf.'
            return []
        }
    }

    function clearError() {
        error.value = null
    }

    return {
        following,
        followers,
        friendRecommendations,
        isLoading,
        error,
        isFollowing,
        loadFollowing,
        loadFollowers,
        followUser,
        unfollowUser,
        loadFriendRecommendations,
        getFollowedUserShelf,
        clearError,
    }
})

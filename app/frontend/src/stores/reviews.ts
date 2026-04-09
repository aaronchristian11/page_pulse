import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export interface Review {
    id: number
    rating: number
    review_text: string | null
    created_at: string
    updated_at: string
    username: string
    first_name: string
    last_name: string
}

export const useReviewsStore = defineStore('reviews', () => {
    const authStore = useAuthStore()

    // keyed by book_key (+ optional ":group_<id>")
    const reviewsByBook = ref<Record<string, Review[]>>({})
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    function cacheKey(bookKey: string, groupId?: string | null) {
        return groupId ? `${bookKey}:group_${groupId}` : bookKey
    }

    async function loadReviews(bookKey: string, groupId?: string | null) {
        const key = cacheKey(bookKey, groupId)
        try {
            isLoading.value = true
            const params: Record<string, any> = {}
            if (groupId) params.group_id = groupId
            const res = await axios.get(`/api/reviews/book/${bookKey}`, {
                params
            })
            reviewsByBook.value[key] = res.data.reviews
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to load reviews.'
        } finally {
            isLoading.value = false
        }
    }

    async function submitReview(
        bookKey: string,
        rating: number,
        reviewText: string,
        groupId?: string | null
    ) {
        try {
            await axios.post(
                '/api/reviews',
                {
                    book_key: bookKey,
                    rating,
                    review_text: reviewText || null,
                    group_id: groupId ?? null,
                })
            // Reload to get fresh data with author info
            await loadReviews(bookKey, groupId)
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to submit review.'
            throw err
        }
    }

    async function deleteReview(reviewId: number, bookKey: string, groupId?: string | null) {
        try {
            await axios.delete(`/api/reviews/${reviewId}`)
            const key = cacheKey(bookKey, groupId)
            if (reviewsByBook.value[key]) {
                reviewsByBook.value[key] = reviewsByBook.value[key].filter(
                    (r) => r.id !== reviewId
                )
            }
        } catch (err: any) {
            error.value = err.response?.data?.error ?? 'Failed to delete review.'
        }
    }

    function getReviews(bookKey: string, groupId?: string | null): Review[] {
        return reviewsByBook.value[cacheKey(bookKey, groupId)] ?? []
    }

    function clearError() {
        error.value = null
    }

    return {
        reviewsByBook,
        isLoading,
        error,
        loadReviews,
        submitReview,
        deleteReview,
        getReviews,
        clearError,
    }
});

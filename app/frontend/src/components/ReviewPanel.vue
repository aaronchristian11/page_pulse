<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReviewsStore } from '@/stores/reviews'
import { useAuthStore } from '@/stores/auth'
import StarRating from '@/components/StarRating.vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Badge from 'primevue/badge'

const props = defineProps<{
    bookKey: string
    groupId?: string | null
}>()

const reviewsStore = useReviewsStore()
const authStore = useAuthStore()

const draftRating = ref<number | null>(null)
const draftText = ref('')
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

const reviews = computed(() => reviewsStore.getReviews(props.bookKey, props.groupId))

const myReview = computed(() =>
    reviews.value.find((r) => r.username === authStore.user?.username)
)

const averageRating = computed(() => {
    if (!reviews.value.length) return null
    const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
    return (sum / reviews.value.length).toFixed(1)
})

onMounted(() => {
    reviewsStore.loadReviews(props.bookKey, props.groupId)
})

watch(
    () => props.bookKey,
    () => reviewsStore.loadReviews(props.bookKey, props.groupId)
)

// Pre-fill form if user already has a review
watch(
    myReview,
    (rev) => {
        if (rev && !draftRating.value) {
            draftRating.value = rev.rating
            draftText.value = rev.review_text ?? ''
        }
    },
    { immediate: true }
)

async function submitReview() {
    if (!draftRating.value) {
        submitError.value = 'Please select a star rating.'
        return
    }
    isSubmitting.value = true
    submitError.value = null
    submitSuccess.value = false
    try {
        await reviewsStore.submitReview(props.bookKey, draftRating.value, draftText.value, props.groupId)
        submitSuccess.value = true
        setTimeout(() => (submitSuccess.value = false), 3000)
    } catch {
        submitError.value = reviewsStore.error ?? 'Failed to submit review.'
    } finally {
        isSubmitting.value = false
    }
}

async function deleteMyReview() {
    if (!myReview.value) return
    await reviewsStore.deleteReview(myReview.value.id, props.bookKey, props.groupId)
    draftRating.value = null
    draftText.value = ''
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}
</script>

<template>
    <div class="flex flex-col gap-5">

        <!-- Average rating summary -->
        <div v-if="reviews.length" class="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
            <span class="text-3xl font-bold text-color">{{ averageRating }}</span>
            <div class="flex flex-col gap-0.5">
                <StarRating :modelValue="Number(averageRating)" :readonly="true" />
                <span class="text-xs text-surface-400">
                    {{ reviews.length }} review{{ reviews.length !== 1 ? 's' : '' }}
                </span>
            </div>
        </div>

        <!-- Write / edit your review -->
        <div v-if="authStore.user" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-color">
                {{ myReview ? 'Your Review' : 'Write a Review' }}
            </p>

            <StarRating
                :modelValue="draftRating"
                @update:modelValue="draftRating = $event"
            />

            <Textarea
                v-model="draftText"
                placeholder="Share your thoughts about this book…"
                rows="3"
                class="w-full text-sm"
            />

            <div class="flex items-center gap-2">
                <Button
                    :label="isSubmitting ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'"
                    icon="pi pi-check"
                    size="small"
                    :loading="isSubmitting"
                    @click="submitReview"
                />
                <Button
                    v-if="myReview"
                    label="Delete"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    @click="deleteMyReview"
                />
            </div>

            <p v-if="submitError" class="text-xs text-red-500">{{ submitError }}</p>
            <p v-if="submitSuccess" class="text-xs text-green-500">Review saved!</p>
        </div>

        <Divider v-if="reviews.length" />

        <!-- Reviews list -->
        <div v-if="reviews.length" class="flex flex-col gap-4">
            <p class="text-sm font-semibold text-color">Community Reviews</p>

            <div
                v-for="review in reviews"
                :key="review.id"
                class="flex flex-col gap-1.5 border-b border-surface-100 dark:border-surface-700 pb-4 last:border-0"
            >
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {{ review.first_name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-sm font-medium text-color">
                            {{ review.first_name }} {{ review.last_name }}
                        </span>
                        <Badge
                            v-if="review.username === authStore.user?.username"
                            value="You"
                            severity="info"
                            class="text-xs"
                        />
                    </div>
                    <span class="text-xs text-surface-400 flex-shrink-0">
                        {{ formatDate(review.created_at) }}
                    </span>
                </div>

                <StarRating :modelValue="review.rating" :readonly="true" size="sm" />

                <p v-if="review.review_text" class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                    {{ review.review_text }}
                </p>
            </div>
        </div>

        <p v-else class="text-sm text-surface-400 italic">
            No reviews yet. Be the first!
        </p>
    </div>
</template>

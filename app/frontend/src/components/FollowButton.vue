<script setup lang="ts">
import { computed } from 'vue'
import { useFollowsStore } from '@/stores/follows'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'

const props = defineProps<{
    userId: number
    username: string
}>()

const followsStore = useFollowsStore()
const authStore = useAuthStore()

const isSelf = computed(() => authStore.user?.id === props.userId)
const following = computed(() => followsStore.isFollowing(props.userId))

async function toggle() {
    if (following.value) {
        await followsStore.unfollowUser(props.userId)
    } else {
        await followsStore.followUser(props.userId)
    }
}
</script>

<template>
    <Button
        v-if="!isSelf && authStore.user"
        :icon="following ? 'pi pi-user-minus' : 'pi pi-user-plus'"
        :label="following ? 'Unfollow' : 'Follow'"
        :severity="following ? 'secondary' : 'primary'"
        size="small"
        :loading="followsStore.isLoading"
        @click="toggle"
    />
</template>

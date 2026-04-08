<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRecommendationsStore } from '@/stores/recommendations'
    import { useFollowsStore } from '@/stores/follows'
    import { useGroupShelvesStore } from '@/stores/groupShelves'
    import { useAuthStore } from '@/stores/auth'
    import Button from 'primevue/button'
    import Dialog from 'primevue/dialog'
    import Textarea from 'primevue/textarea'
    import Select from 'primevue/select'
    import ToggleButton from 'primevue/togglebutton'

    const props = defineProps<{
        bookKey: string
        bookTitle: string
    }>()

    const recStore = useRecommendationsStore()
    const followsStore = useFollowsStore()
    const groupsStore = useGroupShelvesStore()
    const authStore = useAuthStore()

    const visible = ref(false)
    const mode = ref<'friend' | 'group'>('friend')
    const selectedRecipient = ref<number | null>(null)
    const selectedGroup = ref<string | null>(null)
    const message = ref('')
    const isSending = ref(false)
    const sent = ref(false)
    const sendError = ref<string | null>(null)

    const friendOptions = computed(() =>
        followsStore.following.map((u) => ({
            label: `${u.first_name} ${u.last_name} (@${u.username})`,
            value: u.id,
        }))
    )

    const groupOptions = computed(() =>
        groupsStore.joinedGroups.map((g) => ({
            label: g.name,
            value: g.id,
        }))
    )

    onMounted(async () => {
        if (authStore.user) {
            await followsStore.loadFollowing()
            await groupsStore.loadGroups()
        }
    })

    function open() {
        visible.value = true
        sent.value = false
        sendError.value = null
        message.value = ''
        selectedRecipient.value = null
        selectedGroup.value = null
    }

    async function send() {
        if (mode.value === 'friend' && !selectedRecipient.value) {
            sendError.value = 'Please select a friend.'
            return
        }
        if (mode.value === 'group' && !selectedGroup.value) {
            sendError.value = 'Please select a group.'
            return
        }

        isSending.value = true
        sendError.value = null
        try {
            await recStore.sendRecommendation(
                props.bookKey,
                mode.value === 'friend' ? selectedRecipient.value! : undefined,
                mode.value === 'group' ? Number(selectedGroup.value) : undefined,
                message.value || undefined
            )
            sent.value = true
            setTimeout(() => (visible.value = false), 1800)
        } catch {
            sendError.value = recStore.error ?? 'Failed to send.'
        } finally {
            isSending.value = false
        }
    }
</script>

<template>
    <Button icon="pi pi-share-alt"
            label="Recommend"
            size="small"
            severity="secondary"
            @click="open" />

    <Dialog v-model:visible="visible" :header="`Recommend ${bookTitle}`" modal :style="{ width: '22rem' }">
        <div class="flex flex-col gap-4 py-1">

            <!-- Mode toggle -->
            <div class="flex gap-2">
                <Button label="To a Friend"
                        size="small"
                        :severity="mode === 'friend' ? 'primary' : 'secondary'"
                        @click="mode = 'friend'" />
                <Button label="To a Group"
                        size="small"
                        :severity="mode === 'group' ? 'primary' : 'secondary'"
                        @click="mode = 'group'" />
            </div>

            <!-- Friend picker -->
            <div v-if="mode === 'friend'">
                <label class="text-xs text-surface-400 mb-1 block">Select friend</label>
                <Select v-model="selectedRecipient"
                        :options="friendOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Choose a friend…"
                        class="w-full" />
                <p v-if="!friendOptions.length" class="text-xs text-surface-400 mt-1">
                    You aren't following anyone yet.
                </p>
            </div>

            <!-- Group picker -->
            <div v-if="mode === 'group'">
                <label class="text-xs text-surface-400 mb-1 block">Select group</label>
                <Select v-model="selectedGroup"
                        :options="groupOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Choose a group…"
                        class="w-full" />
                <p v-if="!groupOptions.length" class="text-xs text-surface-400 mt-1">
                    You haven't joined any groups yet.
                </p>
            </div>

            <!-- Optional message -->
            <div>
                <label class="text-xs text-surface-400 mb-1 block">Message (optional)</label>
                <Textarea v-model="message"
                          placeholder="You'll love this one because…"
                          rows="2"
                          class="w-full text-sm" />
            </div>

            <p v-if="sendError" class="text-xs text-red-500">{{ sendError }}</p>

            <p v-if="sent" class="text-sm text-green-500 font-medium text-center">
                <i class="pi pi-check-circle mr-1" /> Recommendation sent!
            </p>

            <Button v-if="!sent"
                    label="Send Recommendation"
                    icon="pi pi-send"
                    :loading="isSending"
                    class="w-full"
                    @click="send" />
        </div>
    </Dialog>
</template>

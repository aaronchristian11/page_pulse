<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    modelValue: number | null
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
    'update:modelValue': [rating: number]
}>()

const hovered = ref<number | null>(null)

const iconSize = computed(() => {
    if (props.size === 'sm') return 'text-sm'
    if (props.size === 'lg') return 'text-2xl'
    return 'text-lg'
})

function select(star: number) {
    if (!props.readonly) emit('update:modelValue', star)
}
</script>

<template>
    <div class="flex gap-1">
        <i
            v-for="star in 5"
            :key="star"
            :class="[
                'pi cursor-pointer transition-colors duration-100',
                iconSize,
                (hovered ?? modelValue ?? 0) >= star
                    ? 'pi-star-fill text-yellow-400'
                    : 'pi-star text-surface-300',
                readonly ? 'cursor-default' : 'hover:scale-110'
            ]"
            @mouseenter="!readonly && (hovered = star)"
            @mouseleave="!readonly && (hovered = null)"
            @click="select(star)"
        />
    </div>
</template>

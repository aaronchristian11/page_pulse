<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    modelValue: number | null
    readonly?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [rating: number]
}>()

const hovered = ref<number | null>(null)

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
                'pi cursor-pointer text-lg transition-colors duration-100',
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
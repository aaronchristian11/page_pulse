<script setup lang="ts">
    import { computed, watch } from 'vue'
    import { useBooksStore } from '@/stores/books'
    import Drawer from 'primevue/drawer'
    import Button from 'primevue/button'
    import Tag from 'primevue/tag'
    import ProgressSpinner from 'primevue/progressspinner'
    import Divider from 'primevue/divider'
    import BookBuyButtons from '@/components/BookBuyButtons.vue'
    import ReviewPanel from '@/components/ReviewPanel.vue'
    import RecommendButton from '@/components/RecommendButton.vue'

    const store = useBooksStore();

    const visible = computed({
        get: () => store.selectedBook !== null,
        set: (val) => {
            if (!val) store.clearSelectedBook()
        }
    });

    const book = computed(() => store.selectedBook);
    const detail = computed(() => store.selectedWorkDetail);
</script>

<template>
    <Drawer v-model:visible="visible"
            position="right"
            class="!w-full md:!w-[480px]"
            :pt="{ header: { class: 'pb-0' } }">
        <template #header>
            <span class="font-bold text-lg">Book Details</span>
        </template>

        <div v-if="book" class="flex flex-col gap-5 pb-10">
            <!-- Cover -->
            <div class="flex justify-center">
                <div class="w-36 rounded shadow-lg overflow-hidden bg-surface-100 dark:bg-surface-800 aspect-[2/3]">
                    <img
                        v-if="book.cover_i"
                        :src="store.coverUrl(book.cover_i, 'L')"
                        :alt="book.title"
                        class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-5xl text-surface-400 font-serif">
                        {{ book.title.charAt(0) }}
                    </div>
                </div>
            </div>

            <!-- Title & Author -->
            <div class="text-center">
                <h2 class="text-xl font-bold text-color leading-tight mb-1">{{ book.title }}</h2>
                <p v-if="book.author" class="text-primary font-medium">{{ book.author }}</p>
            </div>

            <!-- Meta row -->
            <div class="flex justify-center gap-6 text-sm text-surface-400">
                <span v-if="book.first_publish_year"><i class="pi pi-calendar mr-1"/>{{ book.first_publish_year }}</span>
                <span v-if="book.isbn"><i class="pi pi-barcode mr-1"/>{{ book.isbn }}</span>
            </div>

            <Divider/>

            <!-- Description -->
            <div>
                <h3 class="font-semibold text-color mb-2">Synopsis</h3>
                <div v-if="store.isLoadingDetail" class="flex justify-center py-4">
                    <ProgressSpinner style="width: 32px; height: 32px"/>
                </div>
                <p v-else-if="detail?.description" class="text-sm text-color-secondary leading-relaxed">{{ detail.description }}</p>
                <p v-else class="text-sm text-surface-400 italic">No description available.</p>
            </div>

            <!-- Subjects -->
            <div v-if="detail?.subjects?.length">
                <h3 class="font-semibold text-color mb-2">Genres / Subjects</h3>
                <div class="flex flex-wrap gap-2">
                    <Tag v-for="s in detail.subjects" :key="s" :value="s" severity="secondary" class="text-xs"/>
                </div>
            </div>

            <Divider/>

            <!-- Buy buttons -->
            <BookBuyButtons :isbn="book.isbn" :title="book.title" :author="book.author" />

            <Divider/>

            <!-- Actions -->
            <div class="flex flex-col gap-3">
                <Button :icon="store.isOnShelf(book.id) ? 'pi pi-check' : 'pi pi-plus'"
                        :label="store.isOnShelf(book.id) ? 'On My Shelf' : 'Add to Shelf'"
                        :severity="store.isOnShelf(book.id) ? 'secondary' : 'primary'"
                        class="w-full"
                        @click="store.isOnShelf(book.id) ? store.removeFromShelf(book.id) : store.addToShelf(book)" />
                <div class="flex gap-2">
                    <RecommendButton :bookKey="book.id" :bookTitle="book.title" class="flex-1" />
                    <a :href="`https://openlibrary.org/works/${book.id}`" target="_blank" rel="noopener" class="flex-1">
                        <Button label="Open Library" icon="pi pi-external-link" severity="secondary" outlined class="w-full"/>
                    </a>
                </div>
            </div>

            <Divider/>

            <!-- Reviews -->
            <div>
                <h3 class="font-semibold text-color mb-3">Reviews</h3>
                <ReviewPanel :bookKey="book.id" />
            </div>
        </div>
    </Drawer>
</template>

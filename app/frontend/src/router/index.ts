import {createRouter, createWebHistory} from 'vue-router'
import BookDetailView from '@/views/BookDetailView.vue'
import LoginView from '@/views/LoginView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: LoginView,
        },
        {
            path: '/book/:title',
            name: 'book',
            component: BookDetailView,
        },
    ],
});

export default router;

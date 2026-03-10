import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/shelf',
            name: 'shelf',
            component: () => import('@/views/ShelfView.vue'),
        },
        {
            path: '/book/:id',
            name: 'book',
            component: () => import('@/views/BookDetailView.vue'),
        },
    ],
})

// Only redirect away from login if already signed in
router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.name === 'login' && auth.user) {
        return { name: 'home' }
    }
})

export default router

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<{ id: number, username: string } | null>(null)

    const setUser = (userData: { id: number, username: string } | null) => {
        user.value = userData

        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('user');
        }
    }

    // rehydrate on page load
    const init = () => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }

    return { user, setUser, init }
});

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // We tell TypeScript that 'user' can be an object with a username, or null
  const user = ref<{ username: string } | null>(null)

  const login = async (username: string, password: string) => {
    console.log('Mock Login:', username, password)
    // Simple mock check
    if (username === 'admin' && password === 'admin123') {
      user.value = { username }
      return true
    }
    // Simulate an error matching what LoginView.vue expects
    throw { response: { data: { error: 'Invalid credentials' } } }
  }

  const register = async (userData: any) => {
    console.log('Mock Register:', userData)
    user.value = { username: userData.username }
    return true
  }

  return { user, login, register }
})
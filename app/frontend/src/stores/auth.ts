import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ username: string } | null>(null)

  // function just to update the state
  const setUser = (userData: { username: string } | null) => {
    user.value = userData
  }

  // only return the user data and the ability to change it
  return { user, setUser }
})
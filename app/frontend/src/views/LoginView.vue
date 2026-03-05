<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <span class="brand-icon">📖</span>
        <h1>Page Pulse</h1>
        <p>Your personal book universe</p>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">Sign In</button>
        <button :class="['tab', { active: mode === 'register' }]" @click="mode = 'register'">Register</button>
      </div>

      <!-- Login Form -->
      <div v-if="mode === 'login'" class="form">
        <div class="field">
          <label>Username</label>
          <InputText v-model="loginForm.username" placeholder="Enter username" class="w-full" @keyup.enter="doLogin" />
        </div>
        <div class="field">
          <label>Password</label>
          <Password v-model="loginForm.password" :feedback="false" toggleMask placeholder="Enter password" class="w-full" @keyup.enter="doLogin" />
        </div>
        <Button label="Sign In" icon="pi pi-sign-in" class="w-full" :loading="loading" @click="doLogin" />
        <div class="hint">Demo: <code>admin/admin123</code></div>
      </div>

      <!-- Register Form -->
      <div v-if="mode === 'register'" class="form">
        <div class="field">
          <label>Username</label>
          <InputText v-model="regForm.username" placeholder="Choose username" class="w-full" />
        </div>
        <div class="field">
          <label>Email</label>
          <InputText v-model="regForm.email" type="email" placeholder="your@email.com" class="w-full" />
        </div>
        <div class="field">
          <label>Age</label>
          <InputNumber v-model="regForm.age" placeholder="Your age" class="w-full" :min="1" :max="120" />
        </div>
        <div class="field">
          <label>Password</label>
          <Password v-model="regForm.password" toggleMask placeholder="Create password" class="w-full" />
        </div>
        <Button label="Create Account" icon="pi pi-user-plus" class="w-full" :loading="loading" @click="doRegister" />
      </div>

      <div v-if="error" class="error-msg">
        <i class="pi pi-exclamation-circle"></i> {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const loginForm = ref({ username: '', password: '' })
const regForm = ref({ username: '', email: '', password: '', age: null })

async function doLogin() {
  error.value = ''
  if (!loginForm.value.username || !loginForm.value.password) { error.value = 'All fields required'; return }
  loading.value = true
  try {
    await auth.login(loginForm.value.username, loginForm.value.password)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Login failed'
  } finally { loading.value = false }
}

async function doRegister() {
  error.value = ''
  if (!regForm.value.username || !regForm.value.email || !regForm.value.password) { error.value = 'All fields required'; return }
  loading.value = true
  try {
    await auth.register(regForm.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Registration failed'
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pp-bg);
  background-image: radial-gradient(ellipse at 20% 50%, rgba(124, 106, 247, 0.08) 0%, transparent 60%),
                    radial-gradient(ellipse at 80% 20%, rgba(232, 164, 90, 0.06) 0%, transparent 50%);
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--pp-surface);
  border: 1px solid var(--pp-border);
  border-radius: 16px;
  padding: 2.5rem;
}
.brand {
  text-align: center;
  margin-bottom: 2rem;
}
.brand-icon { font-size: 2.5rem; }
.brand h1 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: var(--pp-accent);
  margin: 0.25rem 0;
}
.brand p { color: var(--pp-muted); font-size: 0.9rem; }
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: var(--pp-bg);
  border-radius: 8px;
  padding: 4px;
}
.tab {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--pp-muted);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.tab.active { background: var(--pp-surface2); color: var(--pp-text); }
.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-size: 0.85rem; color: var(--pp-muted); }
.hint { text-align: center; font-size: 0.8rem; color: var(--pp-muted); }
.hint code { color: var(--pp-accent); }
.error-msg {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(224, 92, 92, 0.1);
  border: 1px solid rgba(224, 92, 92, 0.3);
  border-radius: 8px;
  color: var(--pp-danger);
  font-size: 0.85rem;
}
</style>

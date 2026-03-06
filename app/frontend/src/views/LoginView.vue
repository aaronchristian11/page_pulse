<template>
    <div class="">
        <div class="login-card">
            <div class="brand">
                <span class="brand-icon">📖</span>
                <h1>Page Pulse</h1>
                <p>Your personal book universe</p>
            </div>

            <div class="tabs">
                <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">
                    Sign In
                </button>
                <button :class="['tab', { active: mode === 'register' }]"
                        @click="mode = 'register'">Register
                </button>
            </div>

            <div v-if="mode === 'login'" class="form">
                <div class="field">
                    <label>Username</label>
                    <InputText v-model="loginForm.username" placeholder="Enter username"
                               class="w-full" @keyup.enter="doLogin"/>
                </div>
                <div class="field">
                    <label>Password</label>
                    <Password v-model="loginForm.password" :feedback="false" toggleMask
                              placeholder="Enter password" class="w-full" @keyup.enter="doLogin"/>
                </div>
                <Button label="Sign In" icon="pi pi-sign-in" class="w-full" :loading="loading"
                        @click="doLogin"/>
                <div class="hint">Demo: <code>admin/admin123</code></div>
            </div>

            <div v-if="mode === 'register'" class="form">
                <div class="field">
                    <label>Username</label>
                    <InputText v-model="regForm.username" placeholder="Choose username"
                               class="w-full"/>
                </div>
                <div class="field">
                    <label>Email</label>
                    <InputText v-model="regForm.email" type="email" placeholder="your@email.com"
                               class="w-full"/>
                </div>
                <div class="field">
                    <label>Age</label>
                    <InputNumber v-model="regForm.age" placeholder="Your age" class="w-full"
                                 :min="1" :max="120"/>
                </div>
                <div class="field">
                    <label>Password</label>
                    <Password v-model="regForm.password" toggleMask placeholder="Create password"
                              class="w-full"/>
                </div>
                <Button label="Create Account" icon="pi pi-user-plus" class="w-full"
                        :loading="loading" @click="doRegister"/>
            </div>

            <div v-if="error" class="error-msg">
                <i class="pi pi-exclamation-circle"></i> {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import axios from 'axios'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const loginForm = ref({username: '', password: ''})
const regForm = ref({username: '', email: '', password: '', age: null})

async function doLogin() {
    error.value = ''
    if (!loginForm.value.username || !loginForm.value.password) {
        error.value = 'All fields required';
        return
    }
    loading.value = true

    try {
        // 1. Component talks to the backend API
        const response = await axios.post('http://localhost:3000/api/login', {
            username: loginForm.value.username,
            password: loginForm.value.password
        })

        // 2. Component tells the store to save the user globally
        auth.setUser(response.data)

        router.push('/')
    } catch (e) {
        error.value = e.response?.data?.error || 'Login failed'
    } finally {
        loading.value = false
    }
}

async function doRegister() {
    error.value = ''
    if (!regForm.value.username || !regForm.value.email || !regForm.value.password) {
        error.value = 'All fields required';
        return
    }
    loading.value = true

    try {
        // 1. Component sends registration to backend API
        const response = await axios.post('http://localhost:3000/api/register', regForm.value)

        // 2. Component tells the store to save the user globally
        auth.setUser(response.data)

        router.push('/')
    } catch (e) {
        error.value = e.response?.data?.error || 'Registration failed'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>

</style>

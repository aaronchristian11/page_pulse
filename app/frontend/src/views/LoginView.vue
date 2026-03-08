<template>
    <div class="col-span-full place-self-center">
        <div class="flex flex-col gap-4">
            <div class="brand">
                <div class="w-full h-full">
                    <img class="object-cover" :src="logo" alt   ="page pulse">
                </div>
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

            <Tabs value="0">
                <TabList>
                    <Tab value="0">Login</Tab>
                    <Tab value="1">Register</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="0">
                        <form @submit="doLogin">
                            <div class="mb-4">
                                <label>Username</label>
                                <InputText v-model="loginForm.username"
                                           placeholder="Enter username"
                                           class="w-full" />
                            </div>
                            <div class="mb-4">
                                <label>Password</label>
                                <Password v-model="loginForm.password"
                                          :feedback="false"
                                          toggleMask
                                          placeholder="Enter password"
                                          inputClass="w-full"
                                          :pt="{
                                              root: { class: 'w-full' },
                                              input: { class: 'w-full' }
                                          }" />
                            </div>
                            <Button label="Sign In"
                                    icon="pi pi-sign-in"
                                    class="w-full mb-4"
                                    :loading="loading"
                                    @click="doLogin"/>
                        </form>
                    </TabPanel>
                    <TabPanel value="1">
                        <form @submit="doRegister">
                            <div class="mb-4">
                                <label>Username</label>
                                <InputText v-model="regForm.username"
                                           placeholder="Choose username"
                                           class="w-full"/>
                            </div>
                            <div class="mb-4">
                                <label>First name</label>
                                <InputText v-model="regForm.first_name"
                                           placeholder="Choose username"
                                           class="w-full"/>
                            </div>
                            <div class="mb-4">
                                <label>Last name</label>
                                <InputText v-model="regForm.last_name"
                                           placeholder="Choose username"
                                           class="w-full"/>
                            </div>
                            <div class="mb-4">
                                <label>Email</label>
                                <InputText v-model="regForm.email"
                                           type="email"
                                           placeholder="your@email.com"
                                           class="w-full"/>
                            </div>
                            <div class="mb-4">
                                <label>Phone number</label>
                                <InputText v-model="regForm.phone_numbeer"
                                           placeholder="Your phone number"
                                           class="w-full" />
                            </div>
                            <div class="mb-4">
                                <label>Password</label>
                                <Password v-model="regForm.password"
                                          toggleMask
                                          placeholder="Create password"
                                          class="w-full" />
                            </div>
                            <div class="mb-4">
                                <label>Confirm Password</label>
                                <Password v-model="regForm.confirm_password"
                                          toggleMask
                                          placeholder="Confirm Password"
                                          class="w-full" />
                            </div>
                            <Button label="Create Account"
                                    icon="pi pi-user-plus"
                                    class="w-full mb-4"
                                    :loading="loading"
                                    @click="doRegister" />
                        </form>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <div v-if="error" class="error-msg">
                <i class="pi pi-exclamation-circle"></i> {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '../stores/auth';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import logo from '@/assets/logo.svg';

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const loginForm = ref({username: '', password: ''})
const regForm = ref({username: '', first_name: '', last_name: '', email: '', password: '', phone_number: ''})

async function doLogin() {
    error.value = ''
    if (!loginForm.value.username || !loginForm.value.password) {
        error.value = 'All fields required';
        return
    }
    loading.value = true

    await axios.post('/api/auth/login', {
        username: loginForm.value.username,
        password: loginForm.value.password
    }).then(res => {
        auth.setUser(res.data);
    }).catch(error => {
        console.log(error);
    }).finally(() => loading.value = false);
}

async function doRegister() {
    error.value = ''
    if (!regForm.value.username || !regForm.value.email || !regForm.value.password) {
        error.value = 'All fields required';
        return
    }
    loading.value = true

    // try {
    //     // 1. Component sends registration to backend API
    //     const response = await axios.post('http://localhost:3000/api/register', regForm.value)
    //
    //     // 2. Component tells the store to save the user globally
    //     auth.setUser(response.data)
    //
    //     router.push('/')
    // } catch (e) {
    //     error.value = e.response?.data?.error || 'Registration failed'
    // } finally {
    //     loading.value = false
    // }

    await axios.post('/api/auth/register', {
        username: regForm.value.username,
        first_name: regForm.value.first_name,
        last_name: regForm.value.last_name,
        email: regForm.value.email,
        password: regForm.value.password,
        phone_number: regForm.value.phone_number
    }).then(res => {
        console.log('you ere registered!')
    }).catch(error => {
        console.log(error);
    }).finally(() => loading.value = false);
}
</script>

<style scoped>

</style>

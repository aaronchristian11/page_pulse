<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Divider from 'primevue/divider'
import logo from '@/assets/logo.svg'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const error = ref('')

const loginForm = ref({ username: '', password: '' })

const regForm = ref({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    address: {
        address_line_1: '',
        address_line_2: '',
        city: '',
        province: '',
        postal_code: '',
    },
})

async function doLogin() {
    error.value = ''
    if (!loginForm.value.username || !loginForm.value.password) {
        error.value = 'All fields required'
        return
    }
    loading.value = true
    try {
        const res = await axios.post('/api/auth/login', {
            username: loginForm.value.username,
            password: loginForm.value.password,
        })
        auth.setUser(res.data.user)
        toast.add({ severity: 'success', summary: 'Successfully Logged In!', life: 3000 })
        router.push('/catalogue')
    } catch (e: any) {
        error.value = e.response?.data?.error || 'Login failed'
    } finally {
        loading.value = false
    }
}

async function doRegister() {
    error.value = ''
    if (!regForm.value.username || !regForm.value.first_name || !regForm.value.last_name || !regForm.value.email || !regForm.value.password) {
        error.value = 'All required fields must be filled in'
        return
    }
    if (regForm.value.password !== regForm.value.confirm_password) {
        error.value = 'Passwords do not match'
        return
    }
    loading.value = true
    try {
        const res = await axios.post('/api/auth/register', {
            username: regForm.value.username,
            first_name: regForm.value.first_name,
            last_name: regForm.value.last_name,
            email: regForm.value.email,
            password: regForm.value.password,
            phone_number: regForm.value.phone_number || null,
            address: regForm.value.address,
        })
        auth.setUser(res.data.user)
        toast.add({ severity: 'success', summary: 'Successfully Registered!', life: 3000 })
        router.push('/catalogue')
    } catch (e: any) {
        error.value = e.response?.data?.error || 'Registration failed'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="col-span-full min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md flex flex-col gap-4">

            <!-- Brand -->
            <div class="flex flex-col items-center gap-2 mb-2">
                <img :src="logo" alt="PagePulse" class="w-16 h-16 object-contain" />
                <h1 class="text-2xl font-bold text-color">Page Pulse</h1>
                <p class="text-surface-400 text-sm">Your personal book universe</p>
            </div>

            <Tabs value="0">
                <TabList>
                    <Tab value="0">Sign In</Tab>
                    <Tab value="1">Register</Tab>
                </TabList>
                <TabPanels>

                    <!-- Login -->
                    <TabPanel value="0">
                        <div class="flex flex-col gap-4 pt-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Username</label>
                                <InputText
                                    v-model="loginForm.username"
                                    placeholder="Enter username"
                                    class="w-full"
                                    @keydown.enter="doLogin"
                                />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Password</label>
                                <Password
                                    v-model="loginForm.password"
                                    :feedback="false"
                                    toggleMask
                                    placeholder="Enter password"
                                    inputClass="w-full"
                                    :pt="{ root: { class: 'w-full' }, input: { class: 'w-full' } }"
                                    @keydown.enter="doLogin"
                                />
                            </div>
                            <Button label="Sign In" icon="pi pi-sign-in" class="w-full" :loading="loading" @click="doLogin" />
                        </div>
                    </TabPanel>

                    <!-- Register -->
                    <TabPanel value="1">
                        <div class="flex flex-col gap-4 pt-4">

                            <!-- Required -->
                            <div class="flex gap-3">
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-sm font-medium text-color">First Name <sup class="text-red-500">*</sup></label>
                                    <InputText v-model="regForm.first_name" placeholder="First name" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-sm font-medium text-color">Last Name <sup class="text-red-500">*</sup></label>
                                    <InputText v-model="regForm.last_name" placeholder="Last name" class="w-full" />
                                </div>
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Email <sup class="text-red-500">*</sup></label>
                                <InputText v-model="regForm.email" type="email" placeholder="your@email.com" class="w-full" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Username <sup class="text-red-500">*</sup></label>
                                <InputText v-model="regForm.username" placeholder="Choose a username" class="w-full" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Password <sup class="text-red-500">*</sup></label>
                                <Password
                                    v-model="regForm.password"
                                    toggleMask
                                    placeholder="Create password"
                                    inputClass="w-full"
                                    :pt="{ root: { class: 'w-full' }, input: { class: 'w-full' } }"
                                />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Confirm Password <sup class="text-red-500">*</sup></label>
                                <Password
                                    v-model="regForm.confirm_password"
                                    :feedback="false"
                                    toggleMask
                                    placeholder="Confirm password"
                                    inputClass="w-full"
                                    :pt="{ root: { class: 'w-full' }, input: { class: 'w-full' } }"
                                />
                            </div>

                            <Divider />
                            <p class="text-xs text-surface-400 -mt-2">Optional Information</p>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Phone Number</label>
                                <InputText v-model="regForm.phone_number" placeholder="Phone number" class="w-full" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Address Line 1</label>
                                <InputText v-model="regForm.address.address_line_1" placeholder="Address line 1" class="w-full" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Address Line 2</label>
                                <InputText v-model="regForm.address.address_line_2" placeholder="Address line 2" class="w-full" />
                            </div>

                            <div class="flex gap-3">
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-sm font-medium text-color">City</label>
                                    <InputText v-model="regForm.address.city" placeholder="City" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-1 flex-1">
                                    <label class="text-sm font-medium text-color">Province</label>
                                    <InputText v-model="regForm.address.province" placeholder="Province" class="w-full" />
                                </div>
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium text-color">Postal Code</label>
                                <InputText v-model="regForm.address.postal_code" placeholder="Postal code" class="w-full" />
                            </div>

                            <Button label="Create Account" icon="pi pi-user-plus" class="w-full" :loading="loading" @click="doRegister" />
                        </div>
                    </TabPanel>

                </TabPanels>
            </Tabs>

            <!-- Error -->
            <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <i class="pi pi-exclamation-circle text-red-500" />
                <span class="text-sm text-red-600 dark:text-red-400">{{ error }}</span>
            </div>

        </div>
    </div>
</template>

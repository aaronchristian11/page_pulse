import './assets/main.css'

import { createApp, type Plugin } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// PrimeVue Version 4 Imports 
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura' 
import 'primeicons/primeicons.css' 

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Tell PrimeVue to use the new Aura theme
// The "as unknown as Plugin" part stops TypeScript from complaining!
app.use(PrimeVue as unknown as Plugin, {
    theme: {
        preset: Aura
    }
})

app.mount('#app')
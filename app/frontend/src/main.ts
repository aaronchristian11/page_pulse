import { createApp, type Plugin } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import '@/assets/main.css'
import axios from "axios";
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

app.use(createPinia())

const auth = useAuthStore();
auth.init();

axios.interceptors.request.use((config) => {
    const auth = useAuthStore();
    if (auth.user) {
        config.headers['x-user-id'] = auth.user.id;
    }
    return config;
});

app.use(router);
app.use(PrimeVue as unknown as Plugin, {
    theme: {
        preset: Aura,
        options: {
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue'
            }
        }
    }
});
app.use(ToastService);

app.mount('#app');

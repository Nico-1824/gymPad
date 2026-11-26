import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css';

const app = createApp(App)

app.use(router)

app.mount('#app')

// Service worker: lets the app show notifications (e.g. when a rest timer ends).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

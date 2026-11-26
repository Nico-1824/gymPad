import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css';

const app = createApp(App)

app.use(router)

app.mount('#app')

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

registerServiceWorker()

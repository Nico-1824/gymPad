<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/util/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function login() {
  errorMsg.value = ''
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (error) {
    errorMsg.value = error.message
    return
  }
  router.push('/')
}

async function signUp() {
  errorMsg.value = ''
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })
  errorMsg.value = error ? error.message : 'Check your email to confirm your account.'
}
</script>

<template>
    <div class="main">
        <header>
            <h1>GymPad</h1>
        </header>
        <div class="card">
            <h1>Your gym tracking companion!</h1>
            <p class="subtitle">Login or sign up</p>
        </div>
        <form @submit.prevent="login">
        <div>
            <input v-model="email" type="email" placeholder="Email" required />
            <input v-model="password" type="password" placeholder="Password" required />
        </div>
        <button type="submit" :disabled="loading">Log in</button>
        <button type="button" @click="signUp">Sign up</button>
        <p v-if="errorMsg">{{ errorMsg }}</p>
        </form>
    </div>
</template>

<style scoped>

header {
    position: absolute;
    top: 1%;
    left: 1%;
    font-family: system-ui, -apple-system, sans-serif;
    border: 0.1rem solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

header h1 {
    font-size: 5rem;
    margin: 1rem;
}

.main {
  /* Change these variables to re-theme the whole page */
  --accent: #fea755;
  --accent-hover: #fea755;
  --bg: #ffbc74;
  --card-bg: #ffffff;
  --text: #18181b;
  --muted: #71717a;
  --border: #d4d4d8;

  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
  flex-direction: column;
}

.card {
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  text-align: center;
}

.subtitle {
  margin: 0.25rem 0 1.5rem;
  color: var(--muted);
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg);
}

.message {
  margin: 0;
  font-size: 0.9rem;
  text-align: center;
  color: var(--muted);
}
</style>
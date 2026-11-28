<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { supabase } from '@/util/supabase'
import { errorMessage } from '@/api/workouts'

const route = useRoute()
const router = useRouter()
const header = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const signedIn = computed(() => route.meta.requiresAuth === true)

const closeMenu = () => (menuOpen.value = false)

function closeOnOutsideTap(event: PointerEvent) {
    if (menuOpen.value && !header.value?.contains(event.target as Node)) closeMenu()
}

function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu()
}

async function signOut() {
    closeMenu()
    const { error } = await supabase.auth.signOut()
    if (error) {
        alert(`Couldn't sign out: ${errorMessage(error)}`)
        return
    }
    await router.replace({ name: 'login' })
}

watch(() => route.fullPath, closeMenu)
onMounted(() => {
    document.addEventListener('pointerdown', closeOnOutsideTap)
    document.addEventListener('keydown', closeOnEscape)
})
onUnmounted(() => {
    document.removeEventListener('pointerdown', closeOnOutsideTap)
    document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
    <header ref="header" class="app-header">
        <h1 v-if="signedIn">
            <button
                type="button"
                class="menu-toggle"
                :aria-expanded="menuOpen"
                aria-controls="app-menu"
                @click="menuOpen = !menuOpen"
            >
                GymPad <span class="chevron" :class="{ open: menuOpen }" aria-hidden="true">▾</span>
            </button>
        </h1>
        <RouterLink v-else to="/"><h1>GymPad</h1></RouterLink>

        <nav v-if="menuOpen" id="app-menu" class="menu">
            <RouterLink to="/" class="menu-item" @click="closeMenu">Home</RouterLink>
            <RouterLink to="/settings" class="menu-item" @click="closeMenu">Settings</RouterLink>
            <button type="button" class="menu-item" @click="signOut">Sign out</button>
        </nav>
    </header>
</template>

<style scoped>
/* Phones/tablets: a normal block at the top, so it never covers the cards */
.app-header {
    position: relative;
    align-self: flex-start;
    margin-bottom: 1.25rem;
    border: 0.1rem solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    background: white;
}

.app-header > a {
    display: block;
    color: inherit;
    text-decoration: none;
}

.app-header h1 {
    margin: 0.4rem 0.9rem;
    font-size: 2rem;
    line-height: 1.2;
}

.menu-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.chevron {
    font-size: 0.5em;
    color: var(--muted);
    transition: transform 0.15s;
}

.chevron.open {
    transform: rotate(180deg);
}

.menu {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    min-width: max(100%, 10rem);
    padding: 0.3rem;
    border: 0.1rem solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    background: white;
}

.menu-item {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0 0.85rem;
    border: none;
    border-radius: 0.35rem;
    background: none;
    color: var(--text);
    font: inherit;
    font-weight: 600;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
    background: #f4f4f5;
}

.menu-item.router-link-exact-active {
    color: var(--accent-hover);
}

@media (prefers-reduced-motion: reduce) {
    .chevron {
        transition: none;
    }
}

/* Wide screens: the big floating logo in the corner */
@media (min-width: 1200px) {
    .app-header {
        position: absolute;
        top: 1%;
        left: 1%;
        margin: 0;
    }

    .app-header h1 {
        margin: 1rem;
        font-size: 5rem;
    }

    .menu {
        font-size: 1.15rem;
    }
}
</style>

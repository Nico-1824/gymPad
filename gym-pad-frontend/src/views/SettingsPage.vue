<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { usePreferences } from '@/composables/usePreferences'
import { errorMessage } from '@/api/workouts'

const { preferences, update } = usePreferences()
const saving = ref(false)
const saveError = ref('')

async function setShowRestTimer(event: Event) {
    const show = (event.target as HTMLInputElement).checked
    saving.value = true
    saveError.value = ''
    try {
        await update({ show_rest_timer: show })
    } catch (err) {
        saveError.value = `Couldn't save your setting: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div class="page">
        <AppHeader />

        <div class="page-column">
            <h2 class="page-title">Settings</h2>

            <p v-if="saveError" class="error-banner" role="alert">{{ saveError }}</p>

            <label class="surface setting">
                <span class="setting-text">
                    <span class="setting-name">Rest timer</span>
                    <span class="setting-description">Show rest timer after completing a set</span>
                </span>
                <input
                    type="checkbox"
                    role="switch"
                    class="switch"
                    :checked="preferences.show_rest_timer"
                    :disabled="saving"
                    @change="setShowRestTimer"
                />
            </label>
        </div>
    </div>
</template>

<style scoped>
.page-title {
    margin: 0;
    font-size: clamp(1.25rem, 5vw, 1.5rem);
}

.setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    cursor: pointer;
}

.setting-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.setting-name {
    font-weight: 600;
}

.setting-description {
    color: var(--muted);
    font-size: 0.9rem;
}

.switch {
    appearance: none;
    position: relative;
    flex-shrink: 0;
    width: 3rem;
    height: 1.75rem;
    margin: 0;
    border-radius: 999px;
    background: var(--border);
    cursor: pointer;
    transition: background 0.15s;
}

.switch::after {
    content: '';
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s;
}

.switch:checked {
    background: var(--accent);
}

.switch:checked::after {
    transform: translateX(1.25rem);
}

.switch:focus-visible {
    outline: 2px solid var(--accent-hover);
    outline-offset: 2px;
}

.switch:disabled {
    opacity: 0.6;
    cursor: wait;
}

@media (prefers-reduced-motion: reduce) {
    .switch,
    .switch::after {
        transition: none;
    }
}
</style>

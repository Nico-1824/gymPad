<script setup lang="ts">
import { computed } from 'vue'
import { useRestTimer } from '@/composables/useRestTimer'
import { notificationsSupported } from '@/util/alerts'

const timer = useRestTimer()

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const time = computed(() => {
    const s = timer.remaining.value
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

// iPhone Safari only supports notifications once GymPad is added to the Home Screen.
const showInstallHint = !notificationsSupported()
</script>

<template>
    <!-- Finished: short "rest over" message -->
    <div v-if="timer.finished.value" class="rest-panel rest-done" role="status">
        <span class="done-text">Rest over — time for your next set 💪</span>
        <button type="button" class="btn btn-ghost" @click="timer.dismiss">Dismiss</button>
    </div>

    <!-- Running + hidden: small pill in the corner -->
    <div v-else-if="timer.running.value && timer.minimized.value" class="rest-pill">
        <button type="button" class="pill-main" aria-label="Show rest timer" @click="timer.show">
            ⏱ <span class="pill-time">{{ time }}</span>
        </button>
        <button type="button" class="pill-cancel" aria-label="Cancel rest timer" @click="timer.cancel">×</button>
    </div>

    <!-- Running: full timer -->
    <section v-else-if="timer.running.value" class="rest-panel" aria-label="Rest timer">
        <div class="rest-top">
            <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
                <circle class="ring-track" cx="30" cy="30" :r="RADIUS" />
                <circle
                    class="ring-fill"
                    cx="30"
                    cy="30"
                    :r="RADIUS"
                    :stroke-dasharray="CIRCUMFERENCE"
                    :stroke-dashoffset="CIRCUMFERENCE * timer.progress.value"
                />
            </svg>
            <div class="rest-info">
                <span class="rest-time" role="timer">{{ time }}</span>
                <span class="rest-label">Rest<template v-if="timer.label.value"> · {{ timer.label.value }}</template></span>
            </div>
        </div>

        <div class="rest-actions">
            <button type="button" class="btn btn-secondary" @click="timer.adjust(-15)">−15s</button>
            <button type="button" class="btn btn-secondary" @click="timer.adjust(15)">+15s</button>
            <span class="spacer"></span>
            <button type="button" class="btn btn-ghost" @click="timer.hide">Hide</button>
            <button type="button" class="btn btn-primary" @click="timer.cancel">Skip</button>
        </div>

        <p v-if="showInstallHint" class="hint">
            Tip: add GymPad to your Home Screen by clicking share and clicking App to Home page to get an alert when your rest ends.
        </p>
    </section>

    <!-- Room at the bottom of the page so the timer never covers the last card -->
    <div
        v-if="timer.running.value || timer.finished.value"
        class="timer-spacer"
        :class="{ small: timer.minimized.value || timer.finished.value }"
        aria-hidden="true"
    ></div>
</template>

<style scoped>
.rest-panel {
    position: fixed;
    left: 50%;
    bottom: max(1rem, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    width: min(500px, calc(100% - 2rem));
    padding: 1rem 1.25rem;
    border-radius: 16px;
    background: var(--card-bg);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slide-up 0.25s ease-out;
}

@keyframes slide-up {
    from {
        opacity: 0;
        transform: translate(-50%, 1rem);
    }
}

@media (prefers-reduced-motion: reduce) {
    .rest-panel {
        animation: none;
    }
}

.rest-top {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.ring {
    width: 3.75rem;
    height: 3.75rem;
    flex-shrink: 0;
    transform: rotate(-90deg); /* start the ring at 12 o'clock */
}

.ring circle {
    fill: none;
    stroke-width: 6;
}

.ring-track {
    stroke: #fff4e8;
}

.ring-fill {
    stroke: var(--accent);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.25s linear;
}

.rest-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.rest-time {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums; /* digits don't jiggle as they change */
    line-height: 1.1;
}

.rest-label {
    color: var(--muted);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
}

.rest-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.85rem;
}

.spacer {
    flex: 1;
}

.hint {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
}

/* ---------- Finished ---------- */
.rest-done {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: var(--success-bg);
    box-shadow: inset 0 0 0 2px var(--success), 0 10px 40px rgba(0, 0, 0, 0.2);
}

.done-text {
    font-weight: 600;
    color: var(--success-dark);
}

/* ---------- Minimized pill ---------- */
.rest-pill {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(1rem, env(safe-area-inset-bottom));
    z-index: 50;
    display: flex;
    align-items: center;
    border-radius: 999px;
    background: var(--text);
    color: white;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
}

.rest-pill button {
    min-height: 2.75rem;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.pill-main {
    padding: 0 0.5rem 0 1rem;
    font-weight: 600;
}

.pill-time {
    font-variant-numeric: tabular-nums;
}

.pill-cancel {
    padding: 0 1rem 0 0.5rem;
    font-size: 1.25rem;
    opacity: 0.7;
}

.pill-cancel:hover {
    opacity: 1;
}

.timer-spacer {
    height: 10rem;
    background: var(--bg);
}

.timer-spacer.small {
    height: 5rem;
}
</style>

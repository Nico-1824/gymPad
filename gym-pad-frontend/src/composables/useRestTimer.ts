import { computed, ref } from 'vue'
import { beep, requestNotificationPermission, showNotification, unlockAudio, vibrate } from '@/util/alerts'

// One rest timer for the whole app (module-level state), so it keeps running
// when you leave the workout page. Saved to localStorage so a refresh doesn't lose it.

export const DEFAULT_REST_SECONDS = 90
const MIN_REMAINING_SECONDS = 5
const STORAGE_KEY = 'gympad:rest-timer'

type SavedTimer = { endsAt: number; duration: number; label: string }

const endsAt = ref<number | null>(null) // timestamp (ms) when the rest ends
const duration = ref(0) // total seconds, for the progress ring
const label = ref('') // e.g. "Bench Press done"
const minimized = ref(false) // "Hide": still running, shown as a small pill
const finished = ref(false) // ran out without being cancelled
const now = ref(Date.now())

let tickTimer: number | undefined
let endTimer: number | undefined
let dismissTimer: number | undefined

const remaining = computed(() =>
    endsAt.value === null ? 0 : Math.max(0, Math.ceil((endsAt.value - now.value) / 1000)),
)
const running = computed(() => endsAt.value !== null && !finished.value)
/** 0 → 1 as the rest goes by. */
const progress = computed(() => (duration.value ? 1 - remaining.value / duration.value : 0))

function stopClocks() {
    window.clearInterval(tickTimer)
    window.clearTimeout(endTimer)
}

function save() {
    if (endsAt.value === null) {
        localStorage.removeItem(STORAGE_KEY)
        return
    }
    const saved: SavedTimer = { endsAt: endsAt.value, duration: duration.value, label: label.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function startClocks() {
    stopClocks()
    if (endsAt.value === null) return
    now.value = Date.now()
    tickTimer = window.setInterval(() => (now.value = Date.now()), 250) // updates the display
    endTimer = window.setTimeout(finish, Math.max(0, endsAt.value - Date.now())) // fires once at the end
}

function finish() {
    if (!running.value) return
    stopClocks()
    now.value = Date.now()
    finished.value = true
    minimized.value = false
    localStorage.removeItem(STORAGE_KEY)

    if (document.visibilityState === 'visible') {
        // App is on screen: beep + the in-app "Rest over" message is enough.
        beep()
        vibrate()
    } else {
        void showNotification('Rest over 💪', label.value ? `${label.value} — time for your next set.` : 'Time for your next set.')
    }

    // The "Rest over" message clears itself after a while.
    window.clearTimeout(dismissTimer)
    dismissTimer = window.setTimeout(dismiss, 10_000)
}

/** Start (or restart) a rest. Call from a tap handler so permission + audio can be unlocked. */
function start(seconds = DEFAULT_REST_SECONDS, text = '') {
    unlockAudio()
    requestNotificationPermission()
    window.clearTimeout(dismissTimer)

    endsAt.value = Date.now() + seconds * 1000
    duration.value = seconds
    label.value = text
    finished.value = false
    minimized.value = false
    save()
    startClocks()
}

/** Stop the rest early. No notification is sent. */
function cancel() {
    stopClocks()
    window.clearTimeout(dismissTimer)
    endsAt.value = null
    finished.value = false
    minimized.value = false
    save()
}

/** Add or remove time from the current rest (e.g. +15 / -15). */
function adjust(seconds: number) {
    if (!running.value || endsAt.value === null) return
    const minEnd = Date.now() + MIN_REMAINING_SECONDS * 1000
    endsAt.value = Math.max(endsAt.value + seconds * 1000, minEnd)
    duration.value = Math.max(duration.value + seconds, Math.ceil((endsAt.value - Date.now()) / 1000))
    save()
    startClocks()
}

/** Clear the "Rest over" message. */
function dismiss() {
    window.clearTimeout(dismissTimer)
    endsAt.value = null
    finished.value = false
}

function restore() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SavedTimer | null
        if (saved && typeof saved.endsAt === 'number' && saved.endsAt > Date.now()) {
            endsAt.value = saved.endsAt
            duration.value = saved.duration
            label.value = saved.label ?? ''
            startClocks()
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY)
    }
}

// Phones pause timers in the background. When the app comes back, catch up.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !running.value || endsAt.value === null) return
    now.value = Date.now()
    if (endsAt.value <= Date.now()) finish()
})

restore()

export function useRestTimer() {
    return {
        remaining,
        progress,
        running,
        finished,
        minimized,
        label,
        start,
        cancel,
        adjust,
        dismiss,
        hide: () => (minimized.value = true),
        show: () => (minimized.value = false),
    }
}

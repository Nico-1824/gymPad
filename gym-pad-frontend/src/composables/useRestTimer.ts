import { computed, ref } from 'vue'
import {
    beep,
    notifyInBackground,
    requestNotificationPermissionFromTap,
    unlockAudioFromTap,
    vibrate,
} from '@/util/alerts'
import { APP_STORAGE_PREFIX } from '@/util/appStorage'

export const DEFAULT_REST_SECONDS = 90
const MIN_REMAINING_SECONDS = 5
const SHOW_REST_OVER_AFTER_RELOAD_WITHIN_MS = 10 * 60 * 1000
const REST_OVER_MESSAGE_VISIBLE_MS = 10_000
const DISPLAY_REFRESH_MS = 250
const STORAGE_KEY = `${APP_STORAGE_PREFIX}rest-timer`

type SavedRest = { endsAtMs: number; totalSeconds: number; label: string }

const endsAtMs = ref<number | null>(null)
const totalSeconds = ref(0)
const label = ref('')
const minimizedToPill = ref(false)
const finished = ref(false)
const nowMs = ref(Date.now())

let displayRefreshInterval: number | undefined
let restEndTimeout: number | undefined
let hideRestOverMessageTimeout: number | undefined

const remainingSeconds = computed(() =>
    endsAtMs.value === null ? 0 : Math.max(0, Math.ceil((endsAtMs.value - nowMs.value) / 1000)),
)
const running = computed(() => endsAtMs.value !== null && !finished.value)
const elapsedFraction = computed(() => (totalSeconds.value ? 1 - remainingSeconds.value / totalSeconds.value : 0))

function stopClocks() {
    window.clearInterval(displayRefreshInterval)
    window.clearTimeout(restEndTimeout)
}

function saveRest() {
    if (endsAtMs.value === null) {
        localStorage.removeItem(STORAGE_KEY)
        return
    }
    const saved: SavedRest = { endsAtMs: endsAtMs.value, totalSeconds: totalSeconds.value, label: label.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function startClocks() {
    stopClocks()
    if (endsAtMs.value === null) return
    nowMs.value = Date.now()
    displayRefreshInterval = window.setInterval(() => (nowMs.value = Date.now()), DISPLAY_REFRESH_MS)
    restEndTimeout = window.setTimeout(finish, Math.max(0, endsAtMs.value - Date.now()))
}

function showRestOverMessage() {
    stopClocks()
    nowMs.value = Date.now()
    finished.value = true
    minimizedToPill.value = false
    localStorage.removeItem(STORAGE_KEY)
    window.clearTimeout(hideRestOverMessageTimeout)
    hideRestOverMessageTimeout = window.setTimeout(dismiss, REST_OVER_MESSAGE_VISIBLE_MS)
}

function alertUserRestIsOver() {
    const appIsOnScreen = document.visibilityState === 'visible'
    if (appIsOnScreen) {
        beep()
        vibrate()
        return
    }
    const body = label.value ? `${label.value} — time for your next set.` : 'Time for your next set.'
    void notifyInBackground('Rest over 💪', body)
}

function finish() {
    if (!running.value) return
    showRestOverMessage()
    alertUserRestIsOver()
}

function startFromTap(seconds = DEFAULT_REST_SECONDS, text = '') {
    unlockAudioFromTap()
    requestNotificationPermissionFromTap()
    window.clearTimeout(hideRestOverMessageTimeout)

    endsAtMs.value = Date.now() + seconds * 1000
    totalSeconds.value = seconds
    label.value = text
    finished.value = false
    minimizedToPill.value = false
    saveRest()
    startClocks()
}

function cancelWithoutAlert() {
    stopClocks()
    window.clearTimeout(hideRestOverMessageTimeout)
    endsAtMs.value = null
    finished.value = false
    minimizedToPill.value = false
    saveRest()
}

function addSeconds(seconds: number) {
    if (!running.value || endsAtMs.value === null) return
    const earliestAllowedEnd = Date.now() + MIN_REMAINING_SECONDS * 1000
    endsAtMs.value = Math.max(endsAtMs.value + seconds * 1000, earliestAllowedEnd)
    totalSeconds.value = Math.max(totalSeconds.value + seconds, Math.ceil((endsAtMs.value - Date.now()) / 1000))
    saveRest()
    startClocks()
}

function dismiss() {
    window.clearTimeout(hideRestOverMessageTimeout)
    endsAtMs.value = null
    finished.value = false
}

function isSavedRest(value: unknown): value is SavedRest {
    if (typeof value !== 'object' || value === null) return false
    const saved = value as Record<string, unknown>
    return (
        typeof saved.endsAtMs === 'number' &&
        typeof saved.totalSeconds === 'number' &&
        saved.totalSeconds > 0 &&
        typeof saved.label === 'string'
    )
}

function readSavedRest(): SavedRest | null {
    try {
        const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        return isSavedRest(saved) ? saved : null
    } catch {
        return null
    }
}

function restoreSavedRest() {
    const saved = readSavedRest()
    const endedTooLongAgo = !saved || saved.endsAtMs <= Date.now() - SHOW_REST_OVER_AFTER_RELOAD_WITHIN_MS
    if (endedTooLongAgo) {
        localStorage.removeItem(STORAGE_KEY)
        return
    }
    endsAtMs.value = saved.endsAtMs
    totalSeconds.value = saved.totalSeconds
    label.value = saved.label
    const endedWhileAppWasClosed = saved.endsAtMs <= Date.now()
    if (endedWhileAppWasClosed) showRestOverMessage()
    else startClocks()
}

function catchUpAfterBackground() {
    if (document.visibilityState !== 'visible' || !running.value || endsAtMs.value === null) return
    nowMs.value = Date.now()
    if (endsAtMs.value <= Date.now()) finish()
}

document.addEventListener('visibilitychange', catchUpAfterBackground)
restoreSavedRest()

export function useRestTimer() {
    return {
        remainingSeconds,
        elapsedFraction,
        running,
        finished,
        minimizedToPill,
        label,
        startFromTap,
        cancel: cancelWithoutAlert,
        addSeconds,
        dismiss,
        minimizeToPill: () => (minimizedToPill.value = true),
        expandFromPill: () => (minimizedToPill.value = false),
    }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

async function loadFreshTimer() {
    vi.resetModules()
    const alerts = await import('@/util/alerts')
    vi.spyOn(alerts, 'beep').mockImplementation(() => {})
    vi.spyOn(alerts, 'vibrate').mockImplementation(() => {})
    vi.spyOn(alerts, 'unlockAudioFromTap').mockImplementation(() => {})
    vi.spyOn(alerts, 'requestNotificationPermissionFromTap').mockImplementation(() => {})
    const notify = vi.spyOn(alerts, 'notifyInBackground').mockResolvedValue()
    const { useRestTimer } = await import('@/composables/useRestTimer')
    return { timer: useRestTimer(), notify, beep: alerts.beep }
}

function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

describe('useRestTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        localStorage.clear()
        setVisibility('visible')
    })
    afterEach(() => vi.useRealTimers())

    it('counts down and finishes with a beep when the app is open', async () => {
        const { timer, notify, beep } = await loadFreshTimer()
        timer.startFromTap(90, 'Bench done')
        expect(timer.running.value).toBe(true)
        expect(timer.remainingSeconds.value).toBe(90)

        vi.advanceTimersByTime(30_000)
        expect(timer.remainingSeconds.value).toBe(60)

        vi.advanceTimersByTime(60_000)
        expect(timer.finished.value).toBe(true)
        expect(timer.running.value).toBe(false)
        expect(beep).toHaveBeenCalled()
        expect(notify).not.toHaveBeenCalled()
    })

    it('sends a notification when the app is in the background', async () => {
        const { timer, notify } = await loadFreshTimer()
        timer.startFromTap(10, 'Squat done')
        setVisibility('hidden')
        vi.advanceTimersByTime(10_000)
        expect(notify).toHaveBeenCalledWith('Rest over 💪', 'Squat done — time for your next set.')
    })

    it('hide keeps it running and still notifies', async () => {
        const { timer, notify } = await loadFreshTimer()
        timer.startFromTap(10)
        timer.minimizeToPill()
        expect(timer.minimizedToPill.value).toBe(true)
        setVisibility('hidden')
        vi.advanceTimersByTime(10_000)
        expect(notify).toHaveBeenCalledOnce()
    })

    it('cancel stops it and never notifies', async () => {
        const { timer, notify, beep } = await loadFreshTimer()
        timer.startFromTap(10)
        timer.cancel()
        setVisibility('hidden')
        vi.advanceTimersByTime(60_000)
        expect(timer.running.value).toBe(false)
        expect(timer.finished.value).toBe(false)
        expect(notify).not.toHaveBeenCalled()
        expect(beep).not.toHaveBeenCalled()
    })

    it('adjust adds time and never goes below 5 seconds', async () => {
        const { timer } = await loadFreshTimer()
        timer.startFromTap(30)
        timer.addSeconds(15)
        expect(timer.remainingSeconds.value).toBe(45)
        timer.addSeconds(-100)
        expect(timer.remainingSeconds.value).toBe(5)
    })

    it('survives a page refresh', async () => {
        const beforePageReload = await loadFreshTimer()
        beforePageReload.timer.startFromTap(60)
        vi.advanceTimersByTime(20_000)
        const afterPageReload = await loadFreshTimer()
        expect(afterPageReload.timer.running.value).toBe(true)
        expect(afterPageReload.timer.remainingSeconds.value).toBe(40)
    })

    it('shows "Rest over" after a reload if the rest ended while the app was closed', async () => {
        const restEndedThirtySecondsAgo = { endsAtMs: Date.now() - 30_000, totalSeconds: 60, label: 'Row done' }
        localStorage.setItem('gympad:rest-timer', JSON.stringify(restEndedThirtySecondsAgo))
        const afterPageReload = await loadFreshTimer()
        expect(afterPageReload.timer.finished.value).toBe(true)
        expect(afterPageReload.timer.running.value).toBe(false)
        expect(localStorage.getItem('gympad:rest-timer')).toBeNull()
    })

    it('drops a saved rest that ended long ago or is malformed', async () => {
        localStorage.setItem('gympad:rest-timer', JSON.stringify({ endsAtMs: Date.now() - 60 * 60_000, totalSeconds: 60, label: '' }))
        const old = await loadFreshTimer()
        expect(old.timer.finished.value).toBe(false)
        expect(old.timer.running.value).toBe(false)

        localStorage.setItem('gympad:rest-timer', JSON.stringify({ endsAtMs: Date.now() + 30_000, label: 'x' }))
        const bad = await loadFreshTimer()
        expect(bad.timer.running.value).toBe(false)
        expect(localStorage.getItem('gympad:rest-timer')).toBeNull()
    })
})

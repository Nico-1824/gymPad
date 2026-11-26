import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The timer is shared module state, so load a fresh copy for each test.
async function freshTimer() {
    vi.resetModules()
    const alerts = await import('@/util/alerts')
    vi.spyOn(alerts, 'beep').mockImplementation(() => {})
    vi.spyOn(alerts, 'vibrate').mockImplementation(() => {})
    vi.spyOn(alerts, 'unlockAudio').mockImplementation(() => {})
    vi.spyOn(alerts, 'requestNotificationPermission').mockImplementation(() => {})
    const notify = vi.spyOn(alerts, 'showNotification').mockResolvedValue()
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
        const { timer, notify, beep } = await freshTimer()
        timer.start(90, 'Bench done')
        expect(timer.running.value).toBe(true)
        expect(timer.remaining.value).toBe(90)

        vi.advanceTimersByTime(30_000)
        expect(timer.remaining.value).toBe(60)

        vi.advanceTimersByTime(60_000)
        expect(timer.finished.value).toBe(true)
        expect(timer.running.value).toBe(false)
        expect(beep).toHaveBeenCalled()
        expect(notify).not.toHaveBeenCalled()
    })

    it('sends a notification when the app is in the background', async () => {
        const { timer, notify } = await freshTimer()
        timer.start(10, 'Squat done')
        setVisibility('hidden')
        vi.advanceTimersByTime(10_000)
        expect(notify).toHaveBeenCalledWith('Rest over 💪', 'Squat done — time for your next set.')
    })

    it('hide keeps it running and still notifies', async () => {
        const { timer, notify } = await freshTimer()
        timer.start(10)
        timer.hide()
        expect(timer.minimized.value).toBe(true)
        setVisibility('hidden')
        vi.advanceTimersByTime(10_000)
        expect(notify).toHaveBeenCalledOnce()
    })

    it('cancel stops it and never notifies', async () => {
        const { timer, notify, beep } = await freshTimer()
        timer.start(10)
        timer.cancel()
        setVisibility('hidden')
        vi.advanceTimersByTime(60_000)
        expect(timer.running.value).toBe(false)
        expect(timer.finished.value).toBe(false)
        expect(notify).not.toHaveBeenCalled()
        expect(beep).not.toHaveBeenCalled()
    })

    it('adjust adds time and never goes below 5 seconds', async () => {
        const { timer } = await freshTimer()
        timer.start(30)
        timer.adjust(15)
        expect(timer.remaining.value).toBe(45)
        timer.adjust(-100)
        expect(timer.remaining.value).toBe(5)
    })

    it('survives a page refresh', async () => {
        const first = await freshTimer()
        first.timer.start(60)
        vi.advanceTimersByTime(20_000)
        const second = await freshTimer() // simulates reloading the page
        expect(second.timer.running.value).toBe(true)
        expect(second.timer.remaining.value).toBe(40)
    })
})

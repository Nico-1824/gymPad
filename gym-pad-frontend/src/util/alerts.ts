// Ways to get the user's attention when a rest timer ends:
// a system notification (when the app is in the background), a beep and a vibration.

/** True when this browser can show notifications through our service worker. */
export function notificationsSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Ask for notification permission (only asks once; the browser remembers the answer).
 * Must be called from a tap/click handler or iOS ignores it.
 */
export function requestNotificationPermission(): void {
    if (!notificationsSupported() || Notification.permission !== 'default') return
    Notification.requestPermission().catch(() => {})
}

export async function showNotification(title: string, body: string): Promise<void> {
    if (!notificationsSupported() || Notification.permission !== 'granted') return
    try {
        const registration = await navigator.serviceWorker.getRegistration()
        const options: NotificationOptions = { body, icon: '/icons/icon-192.png', tag: 'rest-timer' }
        if (registration) await registration.showNotification(title, options)
        else new Notification(title, options)
    } catch {
        // Notifications are a nice-to-have; never let them break the app.
    }
}

// ---------- Sound ----------
// Browsers (especially iOS) only allow audio after a user gesture,
// so unlockAudio() is called when the timer starts (from the tap).

let audio: AudioContext | null = null

export function unlockAudio(): void {
    try {
        audio ??= new AudioContext()
        if (audio.state === 'suspended') void audio.resume()
    } catch {
        audio = null
    }
}

/** Three short beeps. */
export function beep(): void {
    if (!audio) return
    const start = audio.currentTime
    for (let i = 0; i < 3; i++) {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, start + i * 0.3)
        gain.gain.exponentialRampToValueAtTime(0.3, start + i * 0.3 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.3 + 0.2)
        osc.connect(gain).connect(audio.destination)
        osc.start(start + i * 0.3)
        osc.stop(start + i * 0.3 + 0.22)
    }
}

/** Vibrate where supported (Android; iPhone ignores this). */
export function vibrate(): void {
    navigator.vibrate?.([200, 100, 200])
}

export function canNotify(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
}

export function requestNotificationPermissionFromTap(): void {
    if (!canNotify()) return
    const browserRemembersEarlierAnswer = Notification.permission !== 'default'
    if (browserRemembersEarlierAnswer) return
    Notification.requestPermission().catch(() => {})
}

export function userTurnedNotificationsOff(): boolean {
    return canNotify() && Notification.permission === 'denied'
}

function isAppleMobileDevice(): boolean {
    const iPadOsPretendingToBeAMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || iPadOsPretendingToBeAMac
}

function isOpenedFromHomeScreen(): boolean {
    const legacyIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
    return window.matchMedia?.('(display-mode: standalone)').matches || legacyIosStandalone
}

export function needsHomeScreenInstall(): boolean {
    return isAppleMobileDevice() && !isOpenedFromHomeScreen()
}

export async function notifyInBackground(title: string, body: string): Promise<void> {
    if (!canNotify() || Notification.permission !== 'granted') return
    const options: NotificationOptions = { body, icon: '/icons/icon-192.png', tag: 'rest-timer' }
    try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) await registration.showNotification(title, options)
        else new Notification(title, options)
    } catch {}
}

const BEEP_COUNT = 3
const BEEP_SPACING_S = 0.3
const BEEP_FREQUENCY_HZ = 880
const BEEP_VOLUME = 0.3
const SILENT_VOLUME = 0.0001
const BEEP_FADE_IN_S = 0.02
const BEEP_FADE_OUT_AT_S = 0.2
const BEEP_STOP_AT_S = 0.22

let audio: AudioContext | null = null

export function unlockAudioFromTap(): void {
    try {
        audio ??= new AudioContext()
        if (audio.state === 'suspended') void audio.resume()
    } catch {
        audio = null
    }
}

function resumeAudioThenBeep(ctx: AudioContext) {
    ctx.resume()
        .then(() => {
            if (ctx.state === 'running') playBeeps(ctx)
        })
        .catch(() => {})
    document.addEventListener('pointerdown', unlockAudioFromTap, { once: true })
}

export function beep(): void {
    if (!audio) return
    if (audio.state === 'running') playBeeps(audio)
    else resumeAudioThenBeep(audio)
}

function playBeeps(ctx: AudioContext): void {
    for (let i = 0; i < BEEP_COUNT; i++) {
        const beepStart = ctx.currentTime + i * BEEP_SPACING_S
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = BEEP_FREQUENCY_HZ
        gain.gain.setValueAtTime(SILENT_VOLUME, beepStart)
        gain.gain.exponentialRampToValueAtTime(BEEP_VOLUME, beepStart + BEEP_FADE_IN_S)
        gain.gain.exponentialRampToValueAtTime(SILENT_VOLUME, beepStart + BEEP_FADE_OUT_AT_S)
        osc.connect(gain).connect(ctx.destination)
        osc.start(beepStart)
        osc.stop(beepStart + BEEP_STOP_AT_S)
    }
}

export function vibrate(): void {
    navigator.vibrate?.([200, 100, 200])
}

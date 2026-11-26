import { ref, watch, type Ref } from 'vue'

const PREFIX = 'gympad:done:'
const YYYY_MM_DD_LOCALE = 'en-CA'
const todayInLocalTime = () => new Date().toLocaleDateString(YYYY_MM_DD_LOCALE)

export function useCompletedExercises(workoutId: Ref<number | null>) {
    const doneIds = ref(new Set<number>())

    const storageKey = () => `${PREFIX}${workoutId.value}:${todayInLocalTime()}`

    function removeMarksFromPreviousDays() {
        const workoutPrefix = `${PREFIX}${workoutId.value}:`
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(workoutPrefix) && key !== storageKey()) localStorage.removeItem(key)
        }
    }

    function readTodaysMarks(): Set<number> {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey()) ?? '[]')
            return Array.isArray(saved) ? new Set(saved.filter((id) => typeof id === 'number')) : new Set()
        } catch {
            return new Set()
        }
    }

    function load() {
        doneIds.value = new Set()
        if (workoutId.value === null) return
        removeMarksFromPreviousDays()
        doneIds.value = readTodaysMarks()
    }

    function update(next: Set<number>) {
        doneIds.value = next
        if (next.size) localStorage.setItem(storageKey(), JSON.stringify([...next]))
        else localStorage.removeItem(storageKey())
    }

    function isDone(exerciseId: number) {
        return doneIds.value.has(exerciseId)
    }

    function toggle(exerciseId: number) {
        const next = new Set(doneIds.value)
        if (!next.delete(exerciseId)) next.add(exerciseId)
        update(next)
    }

    function forgetDeletedExercise(exerciseId: number) {
        if (!doneIds.value.has(exerciseId)) return
        const next = new Set(doneIds.value)
        next.delete(exerciseId)
        update(next)
    }

    function reset() {
        update(new Set())
    }

    watch(workoutId, load, { immediate: true })

    return { isDone, toggle, forgetDeletedExercise, reset }
}

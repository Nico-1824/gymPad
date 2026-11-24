import { ref, watch, type Ref } from 'vue'

// Tracks which exercises are marked done in today's session.
// Saved in localStorage per workout *per day*, so it survives a refresh
// but starts fresh the next time you do the workout.

const PREFIX = 'gympad:done:'
const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time

export function useCompletedExercises(workoutId: Ref<number | null>) {
    const doneIds = ref(new Set<number>())

    const storageKey = () => `${PREFIX}${workoutId.value}:${today()}`

    function load() {
        doneIds.value = new Set()
        if (workoutId.value === null) return

        // Clean up this workout's marks from previous days.
        const workoutPrefix = `${PREFIX}${workoutId.value}:`
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(workoutPrefix) && key !== storageKey()) localStorage.removeItem(key)
        }

        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey()) ?? '[]')
            if (Array.isArray(saved)) doneIds.value = new Set(saved.filter((id) => typeof id === 'number'))
        } catch {
            // Corrupt entry: just start fresh.
        }
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

    /** Call when an exercise is deleted so it doesn't linger in storage. */
    function forget(exerciseId: number) {
        if (!doneIds.value.has(exerciseId)) return
        const next = new Set(doneIds.value)
        next.delete(exerciseId)
        update(next)
    }

    function reset() {
        update(new Set())
    }

    watch(workoutId, load, { immediate: true })

    return { isDone, toggle, forget, reset }
}

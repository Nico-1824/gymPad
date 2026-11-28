import { ref, watch, type Ref } from 'vue'
import type { Exercise } from '@/types/workout'
import { MAX_SETS } from '@/util/exerciseLimits'
import { APP_STORAGE_PREFIX } from '@/util/appStorage'

const PREFIX = `${APP_STORAGE_PREFIX}done:`
const YYYY_MM_DD_LOCALE = 'en-CA'
const todayInLocalTime = () => new Date().toLocaleDateString(YYYY_MM_DD_LOCALE)

type SetsDoneById = Record<number, number>

const isSetCount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value > 0

function fromLegacyListOfFinishedIds(saved: unknown[]): SetsDoneById {
    const progress: SetsDoneById = {}
    for (const id of saved) if (typeof id === 'number') progress[id] = MAX_SETS
    return progress
}

function fromSetsDoneById(saved: object): SetsDoneById {
    const progress: SetsDoneById = {}
    for (const [id, count] of Object.entries(saved)) {
        if (Number.isInteger(Number(id)) && isSetCount(count)) progress[Number(id)] = count
    }
    return progress
}

export function useSetProgress(workoutId: Ref<number | null>) {
    const progress = ref<SetsDoneById>({})

    const storageKey = () => `${PREFIX}${workoutId.value}:${todayInLocalTime()}`

    function removeProgressFromPreviousDays() {
        const workoutPrefix = `${PREFIX}${workoutId.value}:`
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(workoutPrefix) && key !== storageKey()) localStorage.removeItem(key)
        }
    }

    function readTodaysProgress(): SetsDoneById {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey()) ?? '{}')
            if (Array.isArray(saved)) return fromLegacyListOfFinishedIds(saved)
            if (saved && typeof saved === 'object') return fromSetsDoneById(saved)
            return {}
        } catch {
            return {}
        }
    }

    function load() {
        progress.value = {}
        if (workoutId.value === null) return
        removeProgressFromPreviousDays()
        progress.value = readTodaysProgress()
    }

    function save(next: SetsDoneById) {
        progress.value = next
        if (Object.keys(next).length) localStorage.setItem(storageKey(), JSON.stringify(next))
        else localStorage.removeItem(storageKey())
    }

    function setsDone(exercise: Exercise) {
        return Math.min(progress.value[exercise.exercise_id] ?? 0, exercise.sets)
    }

    function isDone(exercise: Exercise) {
        return setsDone(exercise) >= exercise.sets
    }

    function setSetsDone(exercise: Exercise, count: number) {
        const next = { ...progress.value }
        const clamped = Math.max(0, Math.min(count, exercise.sets))
        if (clamped === 0) delete next[exercise.exercise_id]
        else next[exercise.exercise_id] = clamped
        save(next)
    }

    const logSet = (exercise: Exercise) => setSetsDone(exercise, setsDone(exercise) + 1)
    const finish = (exercise: Exercise) => setSetsDone(exercise, exercise.sets)
    const clear = (exercise: Exercise) => setSetsDone(exercise, 0)

    function forgetDeletedExercise(exerciseId: number) {
        if (!(exerciseId in progress.value)) return
        const next = { ...progress.value }
        delete next[exerciseId]
        save(next)
    }

    function reset() {
        save({})
    }

    watch(workoutId, load, { immediate: true })

    return { setsDone, isDone, setSetsDone, logSet, finish, clear, forgetDeletedExercise, reset }
}

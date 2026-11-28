import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useSetProgress } from '@/composables/useSetProgress'
import type { Exercise } from '@/types/workout'

const WORKOUT_ID = 7
const todaysKey = () => `gympad:done:${WORKOUT_ID}:${new Date().toLocaleDateString('en-CA')}`
const bench: Exercise = { exercise_id: 1, name: 'Bench', sets: 3, reps: 8, weight: 135 }
const squat: Exercise = { exercise_id: 2, name: 'Squat', sets: 4, reps: 5, weight: null }

describe('useSetProgress', () => {
    beforeEach(() => localStorage.clear())

    it('logs sets one at a time and stops at the set count', () => {
        const progress = useSetProgress(ref(WORKOUT_ID))
        progress.logSet(bench)
        progress.logSet(bench)
        expect(progress.setsDone(bench)).toBe(2)
        expect(progress.isDone(bench)).toBe(false)
        progress.logSet(bench)
        progress.logSet(bench)
        expect(progress.setsDone(bench)).toBe(3)
        expect(progress.isDone(bench)).toBe(true)
    })

    it('finishes and clears in one shot', () => {
        const progress = useSetProgress(ref(WORKOUT_ID))
        progress.finish(squat)
        expect(progress.setsDone(squat)).toBe(4)
        progress.clear(squat)
        expect(progress.setsDone(squat)).toBe(0)
        expect(localStorage.getItem(todaysKey())).toBeNull()
    })

    it('caps progress when the set count is edited lower', () => {
        const progress = useSetProgress(ref(WORKOUT_ID))
        progress.setSetsDone(squat, 3)
        const editedToTwoSets = { ...squat, sets: 2 }
        expect(progress.setsDone(editedToTwoSets)).toBe(2)
        expect(progress.isDone(editedToTwoSets)).toBe(true)
        const editedToFiveSets = { ...squat, sets: 5 }
        expect(progress.setsDone(editedToFiveSets)).toBe(3)
    })

    it('survives a reload', () => {
        useSetProgress(ref(WORKOUT_ID)).setSetsDone(bench, 2)
        expect(useSetProgress(ref(WORKOUT_ID)).setsDone(bench)).toBe(2)
    })

    it('reads the old list of finished ids as fully done', () => {
        localStorage.setItem(todaysKey(), JSON.stringify([bench.exercise_id]))
        const progress = useSetProgress(ref(WORKOUT_ID))
        expect(progress.isDone(bench)).toBe(true)
        expect(progress.setsDone(squat)).toBe(0)
    })

    it('ignores corrupted saved progress', () => {
        localStorage.setItem(todaysKey(), JSON.stringify({ 1: 'lots', abc: 2, 2: -1 }))
        const progress = useSetProgress(ref(WORKOUT_ID))
        expect(progress.setsDone(bench)).toBe(0)
        expect(progress.setsDone(squat)).toBe(0)
    })
})

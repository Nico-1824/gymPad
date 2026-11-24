<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExerciseInput, Workout } from '@/types/workout'
import { getWorkout, createExercise, updateExercise, deleteExercise, errorMessage } from '@/api/workouts'
import AppHeader from '@/components/AppHeader.vue'
import ExerciseCard from '@/components/ExerciseCard.vue'
import ExerciseForm from '@/components/ExerciseForm.vue'
import { useCompletedExercises } from '@/composables/useCompletedExercises'

// Route param from /workouts/:id (passed in as a prop by the router)
const props = defineProps<{ id: string }>()

const workout = ref<Workout | null>(null)
const loading = ref(true)
const loadError = ref('')

// Add / edit / delete state
const adding = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const actionError = ref('')

// Done marks for today's session (stored in the browser, not the database)
const { isDone, toggle, forget, reset } = useCompletedExercises(
    computed(() => workout.value?.workout_id ?? null),
)
const totalCount = computed(() => workout.value?.exercises.length ?? 0)
const doneCount = computed(() => workout.value?.exercises.filter((e) => isDone(e.exercise_id)).length ?? 0)
const allDone = computed(() => totalCount.value > 0 && doneCount.value === totalCount.value)

async function loadWorkout() {
    loading.value = true
    loadError.value = ''
    adding.value = false
    editingId.value = null
    try {
        const id = Number(props.id)
        workout.value = Number.isInteger(id) ? await getWorkout(id) : null
    } catch (err) {
        loadError.value = errorMessage(err)
    } finally {
        loading.value = false
    }
}

function startAdding() {
    editingId.value = null
    actionError.value = ''
    adding.value = true
}

function startEditing(id: number) {
    adding.value = false
    actionError.value = ''
    editingId.value = id
}

async function onAdd(input: ExerciseInput) {
    if (!workout.value) return
    saving.value = true
    actionError.value = ''
    try {
        workout.value.exercises.push(await createExercise(workout.value.workout_id, input))
        adding.value = false
    } catch (err) {
        actionError.value = `Couldn't add exercise: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

async function onSave(exerciseId: number, input: ExerciseInput) {
    if (!workout.value) return
    saving.value = true
    actionError.value = ''
    try {
        const updated = await updateExercise(exerciseId, input)
        const list = workout.value.exercises
        list.splice(list.findIndex((e) => e.exercise_id === exerciseId), 1, updated)
        editingId.value = null
    } catch (err) {
        actionError.value = `Couldn't save exercise: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

async function onDelete(exerciseId: number, name: string) {
    if (!workout.value) return
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return

    saving.value = true
    actionError.value = ''
    try {
        await deleteExercise(exerciseId)
        workout.value.exercises = workout.value.exercises.filter((e) => e.exercise_id !== exerciseId)
        forget(exerciseId)
    } catch (err) {
        actionError.value = `Couldn't delete exercise: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

// Load on first visit and whenever the URL's id changes.
watch(() => props.id, loadWorkout, { immediate: true })
</script>

<template>
    <div class="page">
        <AppHeader />

        <div class="page-column">
            <RouterLink to="/" class="back">← All workouts</RouterLink>

            <template v-if="loading">
                <div class="skeleton-line title page-title-skeleton" aria-hidden="true"></div>
                <div v-for="n in 3" :key="n" class="surface" aria-hidden="true">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                </div>
                <span class="sr-only" role="status">Loading workout…</span>
            </template>

            <div v-else-if="loadError" class="surface state-card error" role="alert">
                <div class="state-icon">!</div>
                <h2>Couldn't load this workout</h2>
                <p>{{ loadError }}</p>
                <button type="button" class="btn btn-primary" @click="loadWorkout">Try again</button>
            </div>

            <div v-else-if="!workout" class="surface state-card">
                <div class="state-icon">?</div>
                <h2>Workout not found</h2>
                <p>It may have been deleted.</p>
                <RouterLink to="/" class="btn btn-primary">Back to workouts</RouterLink>
            </div>

            <template v-else>
                <div class="toolbar">
                    <h2>{{ workout.workout_name }}</h2>
                    <button v-if="!adding" type="button" class="btn btn-primary" @click="startAdding">
                        + Add exercise
                    </button>
                </div>

                <div v-if="totalCount > 0" class="progress" :class="{ complete: allDone }">
                    <div class="progress-text">
                        <span v-if="allDone">Workout complete! 🎉</span>
                        <span v-else>{{ (doneCount / totalCount * 100).toFixed(0) }}% Done · Tap an exercise to check it off...</span>
                        <button v-if="doneCount > 0" type="button" class="btn btn-ghost" @click="reset">
                            Reset
                        </button>
                    </div>
                    <div
                        class="progress-track"
                        role="progressbar"
                        :aria-valuenow="doneCount"
                        aria-valuemin="0"
                        :aria-valuemax="totalCount"
                        aria-label="Exercises done"
                    >
                        <div class="progress-fill" :style="{ width: `${(doneCount / totalCount) * 100}%` }"></div>
                    </div>
                </div>

                <p v-if="actionError" class="error-banner" role="alert">{{ actionError }}</p>

                <div v-if="adding" class="surface">
                    <ExerciseForm
                        submit-label="Add exercise"
                        :busy="saving"
                        @submit="onAdd"
                        @cancel="adding = false"
                    />
                </div>

                <div v-if="workout.exercises.length === 0 && !adding" class="surface state-card">
                    <div class="state-icon">💪</div>
                    <h2>No exercises yet</h2>
                    <p>Add the exercises you do in this workout.</p>
                </div>

                <ExerciseCard
                    v-for="ex in workout.exercises"
                    :key="ex.exercise_id"
                    :exercise="ex"
                    :editing="editingId === ex.exercise_id"
                    :done="isDone(ex.exercise_id)"
                    :busy="saving"
                    @toggle="toggle(ex.exercise_id)"
                    @edit="startEditing(ex.exercise_id)"
                    @cancel="editingId = null"
                    @save="onSave(ex.exercise_id, $event)"
                    @delete="onDelete(ex.exercise_id, ex.name)"
                />
            </template>
        </div>
    </div>
</template>

<style scoped>
.back {
    align-self: flex-start;
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
    opacity: 0.75;
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
}

.back:hover {
    opacity: 1;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.toolbar h2 {
    margin: 0;
    font-size: 1.5rem;
    overflow-wrap: anywhere;
}

.progress {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.9rem;
    font-weight: 600;
}

.progress-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2rem;
}

.progress.complete .progress-text {
    color: var(--success-dark);
}

.progress-track {
    height: 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.6);
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--success);
    transition: width 0.3s ease;
}

.page-title-skeleton {
    width: 50%;
    height: 1.75rem;
    background-color: rgba(255, 255, 255, 0.5);
}

.state-card a.btn {
    display: inline-block;
    margin-top: 1.25rem;
    text-decoration: none;
}
</style>

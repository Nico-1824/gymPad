<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Workout } from '@/types/workout'
import { listWorkouts, createWorkout, renameWorkout, deleteWorkoutAndItsExercises, errorMessage } from '@/api/workouts'
import AppHeader from '@/components/AppHeader.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import NameForm from '@/components/NameForm.vue'

const workouts = ref<Workout[]>([])
const loading = ref(true)
const loadError = ref('')

const adding = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const actionError = ref('')

async function loadWorkouts() {
    loading.value = true
    loadError.value = ''
    try {
        workouts.value = await listWorkouts()
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

async function onAdd(name: string) {
    saving.value = true
    actionError.value = ''
    try {
        workouts.value.push(await createWorkout(name))
        adding.value = false
    } catch (err) {
        actionError.value = `Couldn't add workout: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

async function onRename(workout: Workout, name: string) {
    saving.value = true
    actionError.value = ''
    try {
        await renameWorkout(workout.workout_id, name)
        workout.workout_name = name
        editingId.value = null
    } catch (err) {
        actionError.value = `Couldn't rename workout: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

async function onDelete(workout: Workout) {
    const count = workout.exercises.length
    const extra = count ? ` and its ${count} exercise${count === 1 ? '' : 's'}` : ''
    if (!confirm(`Delete "${workout.workout_name}"${extra}? This can't be undone.`)) return

    saving.value = true
    actionError.value = ''
    try {
        await deleteWorkoutAndItsExercises(workout.workout_id)
        workouts.value = workouts.value.filter((w) => w.workout_id !== workout.workout_id)
    } catch (err) {
        actionError.value = `Couldn't delete workout: ${errorMessage(err)}`
    } finally {
        saving.value = false
    }
}

onMounted(loadWorkouts)
</script>

<template>
    <div class="page">
        <AppHeader />

        <div class="page-column">
            <div v-if="loading" class="workout-container">
                <div class="workout-grid">
                    <div v-for="n in 4" :key="n" class="surface skeleton-card" aria-hidden="true">
                        <div class="skeleton-line title"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
                <span class="sr-only" role="status">Loading workouts…</span>
            </div>

            <div v-else-if="loadError" class="surface state-card error" role="alert">
                <div class="state-icon">!</div>
                <h2>Couldn't load your workouts</h2>
                <p>{{ loadError }}</p>
                <button type="button" class="btn btn-primary" @click="loadWorkouts">Try again</button>
            </div>

            <div class="workout-container" v-else>
                <div class="toolbar full-row">
                    <h2>Your workouts</h2>
                    <button v-if="!adding" type="button" class="btn btn-primary" @click="startAdding">
                        + New workout
                    </button>
                </div>

                <p v-if="actionError" class="error-banner full-row" role="alert">{{ actionError }}</p>

                <div v-if="adding" class="surface full-row">
                    <NameForm
                        placeholder="Workout name, e.g. Push Day"
                        submit-label="Add workout"
                        :busy="saving"
                        @submit="onAdd"
                        @cancel="adding = false"
                    />
                </div>

                <div v-if="workouts.length === 0 && !adding" class="surface state-card full-row">
                    <div class="state-icon">🏋️</div>
                    <h2>No workouts yet</h2>
                    <p>Create your first workout to start tracking.</p>
                </div>

                <div v-if="workouts.length" class="workout-grid">
                    <WorkoutCard
                        v-for="w in workouts"
                        :key="w.workout_id"
                        :workout="w"
                        :editing="editingId === w.workout_id"
                        :busy="saving"
                        @edit="startEditing(w.workout_id)"
                        @cancel="editingId = null"
                        @rename="onRename(w, $event)"
                        @delete="onDelete(w)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.toolbar h2 {
    margin: 0;
    font-size: clamp(1.25rem, 5vw, 1.5rem);
}

/* The dashboard is wider than the other pages so the grid has room */
.page-column {
    max-width: 1100px;
}

/* Toolbar, banner, form, empty state and card grid stacked and centred */
.workout-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Toolbar, error banner, add form and empty state: 500px wide, like before */
.full-row {
    width: 100%;
    max-width: 500px;
}

/*
 * Cards wrap onto new rows and every row is centred under the toolbar,
 * including a last row that isn't full.
 * Cards in the same row stretch to the same height.
 */
.workout-grid {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.25rem;
}

.workout-grid > * {
    flex: 0 0 13rem; /* fixed card width: 4 per row on a laptop, 3 on a tablet */
}

/* Phones: two cards per row, filling the width */
@media (max-width: 480px) {
    .workout-grid {
        gap: 1rem;
    }

    .workout-grid > * {
        flex-basis: calc(50% - 0.5rem); /* half the row minus half the gap */
    }
}

/* Loading placeholders roughly the size of a card */
.skeleton-card {
    min-height: 20dvh;
}

</style>

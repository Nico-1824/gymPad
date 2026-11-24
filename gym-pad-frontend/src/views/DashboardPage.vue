<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Workout } from '@/types/workout'
import { listWorkouts, createWorkout, renameWorkout, deleteWorkout, errorMessage } from '@/api/workouts'
import AppHeader from '@/components/AppHeader.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import NameForm from '@/components/NameForm.vue'

const workouts = ref<Workout[]>([])
const loading = ref(true)
const loadError = ref('')

// Add / edit / delete state
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
        await deleteWorkout(workout.workout_id)
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
            <template v-if="loading">
                <div v-for="n in 3" :key="n" class="surface" aria-hidden="true">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
                <span class="sr-only" role="status">Loading workouts…</span>
            </template>

            <div v-else-if="loadError" class="surface state-card error" role="alert">
                <div class="state-icon">!</div>
                <h2>Couldn't load your workouts</h2>
                <p>{{ loadError }}</p>
                <button type="button" class="btn btn-primary" @click="loadWorkouts">Try again</button>
            </div>

            <template v-else>
                <div class="toolbar">
                    <h2>Your workouts</h2>
                    <button v-if="!adding" type="button" class="btn btn-primary" @click="startAdding">
                        + New workout
                    </button>
                </div>

                <p v-if="actionError" class="error-banner" role="alert">{{ actionError }}</p>

                <div v-if="adding" class="surface">
                    <NameForm
                        placeholder="Workout name, e.g. Push Day"
                        submit-label="Add workout"
                        :busy="saving"
                        @submit="onAdd"
                        @cancel="adding = false"
                    />
                </div>

                <div v-if="workouts.length === 0 && !adding" class="surface state-card">
                    <div class="state-icon">🏋️</div>
                    <h2>No workouts yet</h2>
                    <p>Create your first workout to start tracking.</p>
                </div>

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
            </template>
        </div>
    </div>
</template>

<style scoped>
.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.toolbar h2 {
    margin: 0;
    font-size: 1.5rem;
}
</style>

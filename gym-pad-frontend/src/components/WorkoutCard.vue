<script setup lang="ts">
import type { Workout } from '@/types/workout'
import NameForm from '@/components/NameForm.vue'

// The dashboard decides which card is being renamed and does the saving.
defineProps<{
    workout: Workout
    editing: boolean
    busy?: boolean
}>()

const emit = defineEmits<{
    edit: []
    cancel: []
    rename: [name: string]
    delete: []
}>()
</script>

<template>
    <article class="workout-card surface">
        <NameForm
            v-if="editing"
            :initial="workout.workout_name"
            placeholder="Workout name"
            submit-label="Save"
            :busy="busy"
            @submit="emit('rename', $event)"
            @cancel="emit('cancel')"
        />

        <template v-else>
            <div class="top">
                <RouterLink :to="{ name: 'workout', params: { id: workout.workout_id } }" class="title">
                    <h2>{{ workout.workout_name }}</h2>
                </RouterLink>
                <div class="card-actions">
                    <button type="button" class="btn btn-ghost" :disabled="busy" @click="emit('edit')">Edit</button>
                    <button type="button" class="btn btn-ghost danger" :disabled="busy" @click="emit('delete')">
                        Delete
                    </button>
                </div>
            </div>
            <RouterLink :to="{ name: 'workout', params: { id: workout.workout_id } }" class="summary">
                <ul v-if="workout.exercises.length">
                    <li v-for="ex in workout.exercises" :key="ex.exercise_id">
                        {{ ex.name }}<span v-if="ex.weight !== null"> · {{ ex.weight }} lbs</span>
                    </li>
                </ul>
                <p v-else>No exercises yet. Tap to add some →</p>
            </RouterLink>
        </template>
    </article>
</template>

<style scoped>
.workout-card {
    transition: transform 0.15s, box-shadow 0.15s;
}

.workout-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

a {
    color: inherit;
    text-decoration: none;
}

.title h2 {
    margin: 0;
    font-size: 1.25rem;
}

.title:hover h2 {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 3px;
}

.card-actions {
    display: flex;
    gap: 0.25rem;
}

.summary {
    display: block;
    margin-top: 0.25rem;
    color: var(--muted);
}

.summary ul,
.summary p {
    margin: 0;
}

.summary ul {
    padding-left: 1.25rem;
}
</style>

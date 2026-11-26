<script setup lang="ts">
import { computed } from 'vue'
import type { Workout } from '@/types/workout'
import NameForm from '@/components/NameForm.vue'

const props = defineProps<{
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

const hasExercises = computed(() => props.workout.exercises.length > 0)
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
                <h2>
                    <RouterLink
                        :to="{ name: 'workout', params: { id: workout.workout_id } }"
                        class="stretched-link"
                    >
                        {{ workout.workout_name }}
                    </RouterLink>
                </h2>
                <div class="card-actions" :class="{ 'at-bottom': hasExercises }">
                    <button type="button" class="btn btn-ghost" :disabled="busy" @click="emit('edit')">Edit</button>
                    <button type="button" class="btn btn-ghost danger" :disabled="busy" @click="emit('delete')">
                        Delete
                    </button>
                </div>
                <p v-if="!hasExercises" class="summary">No exercises yet. Tap to add some →</p>
            </div>
        </template>
    </article>
</template>

<style scoped>
.workout-card {
    position: relative; /* the link's ::after layer is sized to the card */
    display: flex;          /* lets .top grow to the card's full height */
    flex-direction: column;
    transition: transform 0.15s, box-shadow 0.15s;
    min-height: 20dvh;
    max-width: 30dvh;
}

@media (hover: hover) {
    .workout-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
    }
}

.top {
    flex: 1; /* fill the card's height (at least its min-height) */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

a {
    color: inherit;
    text-decoration: none;
}

h2 {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 1.75rem;
    text-align: center;
}

/* Stretched link: an invisible layer over the whole card, so a tap anywhere opens the workout */
.stretched-link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
}

/* Keyboard users see the whole card outlined when the link is focused */
.stretched-link:focus-visible {
    outline: none;
}

.workout-card:has(.stretched-link:focus-visible) {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}

@media (hover: hover) {
    .workout-card:hover .stretched-link {
        text-decoration: underline;
        text-decoration-color: var(--accent);
        text-underline-offset: 3px;
    }
}

.card-actions {
    position: relative;
    z-index: 1; /* above the link layer, so Edit/Delete don't open the workout */
    display: flex;
    flex-shrink: 0;
    gap: 0.25rem;
}

/* Takes all spare space above it, so the buttons sit at the bottom of the card */
.card-actions.at-bottom {
    margin-top: auto;
}

.summary {
    margin: 0;
    color: var(--muted);
    text-align: center;
}
</style>

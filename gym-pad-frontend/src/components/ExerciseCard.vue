<script setup lang="ts">
import type { Exercise, ExerciseInput } from '@/types/workout'
import ExerciseForm from '@/components/ExerciseForm.vue'

// The parent page decides which card is being edited / done and does the saving.
const props = defineProps<{
    exercise: Exercise
    editing: boolean
    done: boolean
    busy?: boolean
}>()

const emit = defineEmits<{
    toggle: []
    edit: []
    cancel: []
    save: [input: ExerciseInput]
    delete: []
}>()

const show = (value: number | null) => value ?? '—'

// Tapping anywhere on the card toggles done (except while editing).
function onCardClick() {
    if (!props.editing) emit('toggle')
}
</script>

<template>
    <article
        class="exercise-card surface"
        :class="{ done: done && !editing, tappable: !editing }"
        @click="onCardClick"
    >
        <ExerciseForm
            v-if="editing"
            :initial="exercise"
            submit-label="Save"
            :busy="busy"
            @submit="emit('save', $event)"
            @cancel="emit('cancel')"
        />

        <template v-else>
            <div class="top">
                <!-- The real (keyboard / screen reader) control; the whole card is a tap shortcut. -->
                <button
                    type="button"
                    class="check"
                    :aria-pressed="done"
                    :aria-label="`Mark ${exercise.name} ${done ? 'not done' : 'done'}`"
                    @click.stop="emit('toggle')"
                >
                    <span v-if="done" aria-hidden="true">✓</span>
                </button>
                <h3>{{ exercise.name }}</h3>
                <div class="card-actions">
                    <button type="button" class="btn btn-ghost" :disabled="busy" @click.stop="emit('edit')">
                        Edit
                    </button>
                    <button
                        type="button"
                        class="btn btn-ghost danger"
                        :disabled="busy"
                        @click.stop="emit('delete')"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <dl class="stats">
                <div>
                    <dt>Weight</dt>
                    <dd>{{ show(exercise.weight) }}<small v-if="exercise.weight !== null"> lbs</small></dd>
                </div>
                <div>
                    <dt>Reps</dt>
                    <dd>{{ show(exercise.reps) }}</dd>
                </div>
                <div>
                    <dt>Sets</dt>
                    <dd>{{ show(exercise.sets) }}</dd>
                </div>
            </dl>
        </template>
    </article>
</template>

<style scoped>
.exercise-card {
    transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}

.exercise-card.tappable {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.exercise-card.tappable:active {
    transform: scale(0.99);
}

/* ---------- Done state ---------- */
.exercise-card.done {
    background: var(--success-bg);
    box-shadow: inset 0 0 0 2px var(--success), 0 4px 24px rgba(0, 0, 0, 0.08);
}

.exercise-card.done h3 {
    color: var(--success-dark);
}

.exercise-card.done .stats div {
    background: rgba(255, 255, 255, 0.7);
}

.top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.check {
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    display: grid;
    place-items: center;
    padding: 0;
    border: 2px solid var(--border);
    border-radius: 50%;
    background: white;
    color: white;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
}

.check:hover {
    border-color: var(--success);
}

.check:focus-visible {
    outline: 3px solid rgba(22, 163, 74, 0.35);
    outline-offset: 2px;
}

.done .check {
    background: var(--success);
    border-color: var(--success);
}

h3 {
    flex: 1;
    margin: 0;
    font-size: 1.15rem;
    transition: color 0.2s;
}

.card-actions {
    display: flex;
    gap: 0.25rem;
}

.stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin: 0.75rem 0 0;
}

.stats div {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: #fff4e8;
    transition: background 0.2s;
}

dt {
    font-size: 0.75rem;
    color: var(--muted);
}

dd {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
}

dd small {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted);
}
</style>

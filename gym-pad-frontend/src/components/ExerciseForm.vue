<script setup lang="ts">
import { ref } from 'vue'
import type { ExerciseInput } from '@/types/workout'

// Name + sets/reps/weight + Save/Cancel. Used to add and edit exercises.
const props = defineProps<{
    initial?: ExerciseInput
    submitLabel: string
    busy?: boolean
}>()

const emit = defineEmits<{
    submit: [input: ExerciseInput]
    cancel: []
}>()

// v-model.number gives '' when a number field is cleared, so allow that here.
const name = ref(props.initial?.name ?? '')
const sets = ref<number | ''>(props.initial?.sets ?? '')
const reps = ref<number | ''>(props.initial?.reps ?? '')
const weight = ref<number | ''>(props.initial?.weight ?? '')

const toNullable = (value: number | '') => (value === '' ? null : value)

function onSubmit() {
    const trimmed = name.value.trim()
    if (!trimmed) return
    emit('submit', {
        name: trimmed,
        sets: toNullable(sets.value),
        reps: toNullable(reps.value),
        weight: toNullable(weight.value),
    })
}
</script>

<template>
    <form class="exercise-form" @submit.prevent="onSubmit" @keydown.esc="emit('cancel')">
        <input
            v-model="name"
            class="text-input"
            placeholder="Exercise name"
            aria-label="Exercise name"
            maxlength="100"
            required
            autofocus
        />
        <div class="numbers">
            <label>
                <span>Sets</span>
                <input v-model.number="sets" class="text-input" type="number" min="0" max="999" step="1" />
            </label>
            <label>
                <span>Reps</span>
                <input v-model.number="reps" class="text-input" type="number" min="0" max="999" step="1" />
            </label>
            <label>
                <span>Weight (lbs)</span>
                <input v-model.number="weight" class="text-input" type="number" min="0" max="9999" step="1" />
            </label>
        </div>
        <div class="actions">
            <button type="button" class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="busy">{{ submitLabel }}</button>
        </div>
    </form>
</template>

<style scoped>
.exercise-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.numbers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.numbers label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--muted);
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
</style>

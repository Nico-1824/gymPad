<script setup lang="ts">
import { ref } from 'vue'

// Single text field + Save/Cancel. Used to add and rename workouts.
const props = defineProps<{
    initial?: string
    placeholder: string
    submitLabel: string
    busy?: boolean
}>()

const emit = defineEmits<{
    submit: [name: string]
    cancel: []
}>()

const name = ref(props.initial ?? '')

function onSubmit() {
    const trimmed = name.value.trim()
    if (trimmed) emit('submit', trimmed)
}
</script>

<template>
    <form class="name-form" @submit.prevent="onSubmit" @keydown.esc="emit('cancel')">
        <input
            v-model="name"
            class="text-input"
            :placeholder="placeholder"
            :aria-label="placeholder"
            maxlength="100"
            required
            autofocus
        />
        <div class="actions">
            <button type="button" class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="busy">{{ submitLabel }}</button>
        </div>
    </form>
</template>

<style scoped>
.name-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

@media (max-width: 480px) {
    .actions .btn {
        flex: 1;
    }
}
</style>

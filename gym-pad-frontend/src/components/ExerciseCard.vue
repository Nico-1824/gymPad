<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Exercise, ExerciseInput } from '@/types/workout'
import ExerciseForm from '@/components/ExerciseForm.vue'
import { MOST_SETS_SHOWN_AS_DOTS } from '@/util/exerciseLimits'

const props = defineProps<{
    exercise: Exercise
    editing: boolean
    setsDone: number
    busy?: boolean
}>()

const emit = defineEmits<{
    logSet: []
    setSetsDone: [count: number]
    toggleFinished: []
    edit: []
    cancel: []
    save: [input: ExerciseInput]
    delete: []
}>()

const TAP_SLOP_PX = 10
const SWIPE_FRACTION_TO_TOGGLE = 0.4

const card = ref<HTMLElement | null>(null)
const swipeOffsetPx = ref(0)
const dragging = ref(false)

const done = computed(() => props.setsDone >= props.exercise.sets)
const showDots = computed(() => props.exercise.sets <= MOST_SETS_SHOWN_AS_DOTS)
const showDashIfEmpty = (value: number | null) => value ?? '—'

type Gesture = { pointerId: number; startX: number; startY: number; axis: 'undecided' | 'horizontal' | 'vertical' }
let gesture: Gesture | null = null
let swallowNextClick = false

function onPointerDown(event: PointerEvent) {
    swallowNextClick = false
    if (props.editing || event.button !== 0) return
    gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: 'undecided' }
}

function onPointerMove(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY

    if (gesture.axis === 'undecided') {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_SLOP_PX) return
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
        if (gesture.axis === 'horizontal') {
            card.value?.setPointerCapture(event.pointerId)
            dragging.value = true
        }
    }

    if (gesture.axis === 'horizontal') {
        const cardWidth = card.value?.clientWidth ?? 0
        swipeOffsetPx.value = Math.max(0, Math.min(dx, cardWidth))
    }
}

function onPointerUp(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return
    if (gesture.axis !== 'undecided') swallowNextClick = true
    const cardWidth = card.value?.clientWidth ?? 0
    const swipedFarEnough = gesture.axis === 'horizontal' && swipeOffsetPx.value >= cardWidth * SWIPE_FRACTION_TO_TOGGLE
    endGesture()
    if (swipedFarEnough) emit('toggleFinished')
}

function endGesture() {
    gesture = null
    dragging.value = false
    swipeOffsetPx.value = 0
}

function swallowClickAfterDrag(event: MouseEvent) {
    if (!swallowNextClick) return
    swallowNextClick = false
    event.stopPropagation()
    event.preventDefault()
}

function onCardTap() {
    if (!props.editing && !done.value) emit('logSet')
}

function onDotTap(setNumber: number) {
    emit('setSetsDone', setNumber === props.setsDone ? setNumber - 1 : setNumber)
}
</script>

<template>
    <article
        ref="card"
        class="exercise-card surface"
        :class="{ done: done && !editing, swipeable: !editing, dragging }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="endGesture"
        @click.capture="swallowClickAfterDrag"
        @click="onCardTap"
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
            <button
                type="button"
                class="swipe-strip"
                :style="{ width: `calc(var(--strip-width) + ${swipeOffsetPx}px)` }"
                :aria-label="done ? `Undo ${exercise.name}` : `Mark ${exercise.name} done`"
                @click.stop="emit('toggleFinished')"
            >
                <span class="strip-word" aria-hidden="true">{{ done ? 'UNDO' : 'DONE' }}</span>
                <span class="strip-arrow" aria-hidden="true">→</span>
            </button>

            <div class="card-body" :style="{ transform: `translateX(${swipeOffsetPx}px)` }">
                <div class="top">
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
                        <dd>{{ showDashIfEmpty(exercise.weight) }}<small v-if="exercise.weight !== null"> lbs</small></dd>
                    </div>
                    <div>
                        <dt>Reps</dt>
                        <dd>{{ exercise.reps }}</dd>
                    </div>
                    <div>
                        <dt>Sets</dt>
                        <dd>{{ exercise.sets }}</dd>
                    </div>
                </dl>
                <div class="set-progress">
                    <div v-if="showDots" class="dots">
                        <button
                            v-for="setNumber in exercise.sets"
                            :key="setNumber"
                            type="button"
                            class="dot"
                            :class="{ filled: setNumber <= setsDone }"
                            :aria-label="`Set ${setNumber} of ${exercise.sets}`"
                            :aria-pressed="setNumber <= setsDone"
                            @click.stop="onDotTap(setNumber)"
                        ></button>
                    </div>
                    <span class="set-count" aria-live="polite">{{ setsDone }} / {{ exercise.sets }} sets</span>
                    <button
                        v-if="!showDots && setsDone > 0"
                        type="button"
                        class="btn btn-ghost undo-set"
                        :aria-label="`Undo one set of ${exercise.name}`"
                        @click.stop="emit('setSetsDone', setsDone - 1)"
                    >
                        −1
                    </button>
                    <button
                        v-if="!done"
                        type="button"
                        class="sr-only log-set-for-keyboard"
                        @click.stop="emit('logSet')"
                    >
                        Log a set of {{ exercise.name }}
                    </button>
                </div>
            </div>
        </template>
    </article>
</template>

<style scoped>
.exercise-card {
    --strip-width: 2.25rem;
    position: relative;
    overflow: hidden;
    transition: background 0.2s, box-shadow 0.2s;
}

.exercise-card.swipeable {
    padding: 0;
    cursor: pointer;
    user-select: none;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
}

/* ---------- Swipe strip ---------- */
.swipe-strip {
    position: absolute;
    inset: 0 auto 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0;
    border: none;
    background: #e4e4e7;
    color: var(--muted);
    font: inherit;
    cursor: pointer;
    transition: width 0.2s ease, background 0.2s, color 0.2s;
}

.dragging .swipe-strip,
.swipe-strip:focus-visible {
    background: var(--success);
    color: white;
}

@media (hover: hover) {
    .exercise-card:hover .swipe-strip {
        background: var(--success);
        color: white;
    }

    .exercise-card.done:hover .swipe-strip {
        background: var(--muted);
    }
}

.done.dragging .swipe-strip,
.done .swipe-strip:focus-visible {
    background: var(--muted);
}

.swipe-strip:focus-visible {
    outline: 3px solid rgba(22, 163, 74, 0.35);
    outline-offset: -3px;
}

.strip-word {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.15em;
}

.strip-arrow {
    font-size: 0.9rem;
    font-weight: 700;
}

.card-body {
    position: relative;
    margin-left: var(--strip-width);
    padding: 1rem 1.25rem;
    background: inherit;
    transition: transform 0.2s ease;
}

.dragging .card-body,
.dragging .swipe-strip {
    transition: none;
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

h3 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 1.15rem;
    transition: color 0.2s;
}

.card-actions {
    display: flex;
    flex-shrink: 0;
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

/* ---------- Set progress ---------- */
.set-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    margin-top: 0.5rem;
}

.dots {
    display: flex;
    gap: 0.15rem;
}

.dot {
    position: relative;
    width: 2.25rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
}

.dot::after {
    content: '';
    position: absolute;
    inset: 50% auto auto 50%;
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid var(--border);
    border-radius: 50%;
    background: white;
    transform: translate(-50%, -50%);
    transition: background 0.15s, border-color 0.15s;
}

.dot.filled::after {
    border-color: var(--success);
    background: var(--success);
}

.dot:focus-visible {
    outline: 3px solid rgba(22, 163, 74, 0.35);
    outline-offset: -4px;
    border-radius: 50%;
}

.set-count {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--muted);
}

.done .set-count {
    color: var(--success-dark);
}

.undo-set {
    padding: 0.4rem 0.8rem;
}

.log-set-for-keyboard:focus-visible {
    position: static;
    width: auto;
    height: auto;
    clip: auto;
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: white;
    font: inherit;
}

@media (max-width: 480px) {
    .top {
        gap: 0.5rem;
    }

    .card-body {
        padding: 0.85rem 1rem;
    }

    .stats div {
        padding: 0.4rem 0.6rem;
    }

    dd {
        font-size: 1.1rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .exercise-card,
    .swipe-strip,
    .card-body,
    .dot::after {
        transition: none;
    }
}
</style>

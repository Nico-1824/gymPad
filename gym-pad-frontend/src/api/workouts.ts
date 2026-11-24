import { supabase } from '@/util/supabase'
import type { Exercise, ExerciseInput, Workout } from '@/types/workout'

// Every query below throws the Supabase error on failure, so pages can use try/catch.
// Row-level security limits all of these to the signed-in user's own rows.

const EXERCISE_COLUMNS = 'exercise_id, name, sets, reps, weight'
const WORKOUT_COLUMNS = `workout_id, workout_name, exercises(${EXERCISE_COLUMNS})`

/* ---------- Workouts ---------- */

export async function listWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
        .from('workouts')
        .select(WORKOUT_COLUMNS)
        .order('created_at', { ascending: true })
        .order('created_at', { referencedTable: 'exercises', ascending: true })
    if (error) throw error
    return data
}

/** Returns null if the workout doesn't exist (or belongs to someone else). */
export async function getWorkout(workoutId: number): Promise<Workout | null> {
    const { data, error } = await supabase
        .from('workouts')
        .select(WORKOUT_COLUMNS)
        .eq('workout_id', workoutId)
        .order('created_at', { referencedTable: 'exercises', ascending: true })
        .maybeSingle()
    if (error) throw error
    return data
}

export async function createWorkout(name: string): Promise<Workout> {
    // user_id defaults to auth.uid() in the database, so we only send the name.
    const { data, error } = await supabase
        .from('workouts')
        .insert({ workout_name: name })
        .select(WORKOUT_COLUMNS)
        .single()
    if (error) throw error
    return data
}

export async function renameWorkout(workoutId: number, name: string): Promise<void> {
    const { error } = await supabase
        .from('workouts')
        .update({ workout_name: name })
        .eq('workout_id', workoutId)
    if (error) throw error
}

/** Also deletes the workout's exercises (ON DELETE CASCADE). */
export async function deleteWorkout(workoutId: number): Promise<void> {
    const { error } = await supabase.from('workouts').delete().eq('workout_id', workoutId)
    if (error) throw error
}

/* ---------- Exercises ---------- */

export async function createExercise(workoutId: number, input: ExerciseInput): Promise<Exercise> {
    const { data, error } = await supabase
        .from('exercises')
        .insert({ ...input, workout_id: workoutId })
        .select(EXERCISE_COLUMNS)
        .single()
    if (error) throw error
    return data
}

export async function updateExercise(exerciseId: number, input: ExerciseInput): Promise<Exercise> {
    const { data, error } = await supabase
        .from('exercises')
        .update(input)
        .eq('exercise_id', exerciseId)
        .select(EXERCISE_COLUMNS)
        .single()
    if (error) throw error
    return data
}

export async function deleteExercise(exerciseId: number): Promise<void> {
    const { error } = await supabase.from('exercises').delete().eq('exercise_id', exerciseId)
    if (error) throw error
}

/** Turns anything thrown by the functions above into a readable message. */
export function errorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) return String(err.message)
    return 'Something went wrong.'
}

export type Exercise = {
    exercise_id: number;
    name: string;
    sets: number | null;
    reps: number | null;
    weight: number | null;
}

/** Fields the user can set when adding or editing an exercise. */
export type ExerciseInput = Omit<Exercise, 'exercise_id'>

export type Workout = {
    workout_id: number;
    workout_name: string;
    exercises: Exercise[];
}

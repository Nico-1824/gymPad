export type Exercise = {
    exercise_id: number;
    name: string;
    sets: number;
    reps: number;
    weight: number | null;
}

export type ExerciseInput = Omit<Exercise, 'exercise_id'>

export type Workout = {
    workout_id: number;
    workout_name: string;
    exercises: Exercise[];
}

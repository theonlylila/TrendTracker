/**
 * This is the single source of truth for what lives inside the dashboard's
 * JSON blob. To add a new feature later: add a new array/field here, add it
 * to `emptyDashboardData`, and build a component that reads/writes it. No
 * database migration needed.
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  weekKey: string; // e.g. "2026-W29" — which week this task belongs to
  createdAt: string; // ISO date string
}

export interface GymSession {
  id: string;
  weekKey: string;
  date: string; // YYYY-MM-DD
  activity: string;
  completed: boolean;
}

// ---- Workout tracker ----
// Suggested labels for grouping exercises. Not enforced — `muscleGroup` on
// Exercise is a plain string, this is just used to populate a dropdown.
export const MUSCLE_GROUPS = [
  "Legs",
  "Back",
  "Chest",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Cardio",
  "Full Body",
  "Other",
] as const;

// A single move in your exercise library, e.g. "Barbell Squat".
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  notes?: string;
}

// A named combination of exercises, e.g. "Leg Day" = Squat + Lunge + Leg Press.
export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[]; // ordered
}

// The repeating "every week looks like this" schedule. Always has exactly one
// entry per day of week. dayOfWeek follows JS's Date.getDay(): 0 = Sunday ... 6 = Saturday.
export interface DefaultScheduleDay {
  dayOfWeek: number;
  workoutTemplateId: string | null; // null = rest day
}

// A one-off swap for a specific calendar date (e.g. "just this Tuesday, do
// Push Day instead of the usual Leg Day"). Takes priority over the default
// schedule for that date only.
export interface ScheduleOverride {
  id: string;
  date: string; // YYYY-MM-DD
  workoutTemplateId: string | null;
}

// One set actually performed for one exercise, during one logged workout.
export interface LoggedSet {
  id: string;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
}

// One exercise's worth of sets within a logged workout.
export interface LoggedExercise {
  id: string;
  exerciseId: string;
  exerciseName: string; // snapshot, so renaming/deleting the exercise later doesn't rewrite history
  sets: LoggedSet[];
}

// A record of a workout actually performed on a given date.
export interface WorkoutLog {
  id: string;
  weekKey: string;
  date: string; // YYYY-MM-DD
  workoutTemplateId: string | null;
  workoutName: string; // snapshot of the template name at logging time
  weightUnit: "lbs" | "kg";
  exercises: LoggedExercise[];
  quality: number | null; // 1-5, how well the workout went
  fatigue: number | null; // 1-5, how wiped out you were
  notes: string;
}

// ---- Stretch tracker ----
// A single stretch in your library, e.g. "Couch Stretch".
export interface Stretch {
  id: string;
  name: string;
  notes?: string;
}

// A named combination of stretches, e.g. "Morning Routine".
export interface StretchRoutine {
  id: string;
  name: string;
  stretchIds: string[]; // ordered
}

// The repeating default schedule, same idea as DefaultScheduleDay for workouts.
export interface StretchDefaultScheduleDay {
  dayOfWeek: number;
  routineId: string | null; // null = no stretching that day
}

// A one-off swap for a specific date, same idea as ScheduleOverride for workouts.
export interface StretchScheduleOverride {
  id: string;
  date: string; // YYYY-MM-DD
  routineId: string | null;
}

// A record of stretching actually done on a given date. No sets/weight/quality —
// just which stretches from the day's routine got checked off.
export interface StretchLog {
  id: string;
  weekKey: string;
  date: string; // YYYY-MM-DD
  routineId: string | null;
  routineName: string; // snapshot of the routine name at logging time
  completedStretchIds: string[];
}

// ---- Steps tracker ----
export interface StepEntry {
  id: string;
  weekKey: string;
  date: string; // YYYY-MM-DD
  steps: number;
}

export interface WeeklyFocus {
  weekKey: string;
  focus: string;
  goals: string[];
}

export interface Reflection {
  weekKey: string;
  text: string;
}

export interface CurrentlyReading {
  id: string;
  weekKey: string;
  title: string;
  author: string;
  coverUrl?: string;
}

export interface DashboardData {
  tasks: Task[];
  gymSessions: GymSession[];
  weeklyFocuses: WeeklyFocus[];
  reflections: Reflection[];
  currentlyReading: CurrentlyReading[];
  exercises: Exercise[];
  workoutTemplates: WorkoutTemplate[];
  defaultSchedule: DefaultScheduleDay[];
  scheduleOverrides: ScheduleOverride[];
  workoutLogs: WorkoutLog[];
  stretches: Stretch[];
  stretchRoutines: StretchRoutine[];
  stretchDefaultSchedule: StretchDefaultScheduleDay[];
  stretchScheduleOverrides: StretchScheduleOverride[];
  stretchLogs: StretchLog[];
  stepEntries: StepEntry[];
  stepsGoal: number;
}

export const emptyDashboardData: DashboardData = {
  tasks: [],
  gymSessions: [],
  weeklyFocuses: [],
  reflections: [],
  currentlyReading: [],
  exercises: [],
  workoutTemplates: [],
  defaultSchedule: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    workoutTemplateId: null,
  })),
  scheduleOverrides: [],
  workoutLogs: [],
  stretches: [],
  stretchRoutines: [],
  stretchDefaultSchedule: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    routineId: null,
  })),
  stretchScheduleOverrides: [],
  stretchLogs: [],
  stepEntries: [],
  stepsGoal: 15000,
};

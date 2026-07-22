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

// A logged workout only "counts" as a workout actually performed if it has
// at least one exercise in it. An empty log — e.g. you opened the log, then
// removed every exercise from it — is treated as "no workout that day," so
// the Training Trends calendar reverts that day back to a plain rest day
// instead of leaving a green "done" / red "bonus" mark behind. Without this,
// a leftover empty log shell keeps making it look like you trained when you
// actually cleared the workout out. This lives here (next to the WorkoutLog
// type) so every part of the app that asks "did a workout happen this day?"
// answers it the same way — the Trends calendar and the weekly "✓ logged"
// counter both call this, so they can never disagree.
export function workoutWasPerformed(log: WorkoutLog): boolean {
  return log.exercises.length > 0;
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

// ---- Meal tracker ----
// You always have exactly 5 meal slots a day — generic "Meal 1"..."Meal 5",
// not renameable to "Breakfast/Lunch/Dinner". Kept as a plain number (1-5)
// rather than a union type so the schedule/override arrays below can be
// built with a simple loop, same as the day-of-week arrays already are.
export const MEAL_SLOT_COUNT = 5;

// Suggested tags for filtering the recipe book, e.g. "show me all my
// chicken recipes." Same convention as MUSCLE_GROUPS for exercises: this is
// a starter list for the dropdown/chip UI, not an enforced enum — a
// recipe's `tags` field is just string[], so nothing breaks if a tag here
// is ever renamed or a recipe ends up with a tag outside this list.
export const RECIPE_TAGS = ["Chicken", "Beef", "Pork", "Fish", "Vegetarian", "Bodybuilding"] as const;

// A recipe in your library — a name, a free-text notes box
// (ingredients/instructions/whatever, unstructured), and any number of tags
// for filtering (e.g. a recipe could be both "Chicken" and "Vegetarian").
// `tags` is optional so recipes saved before this field existed still load
// fine — anywhere we read tags, we fall back to an empty array.
export interface Recipe {
  id: string;
  name: string;
  notes?: string;
  tags?: string[];
}

// The repeating "every week looks like this" schedule, one entry per
// (mealSlot, dayOfWeek) pair — 5 slots x 7 days = 35 entries total, always
// fully populated (see emptyDashboardData below). This is the meal-tracker
// equivalent of DefaultScheduleDay, with mealSlot as the added dimension
// since you have 5 independent slots per day instead of 1 workout per day.
export interface MealDefaultScheduleEntry {
  mealSlot: number; // 1-5
  dayOfWeek: number; // JS Date.getDay(): 0 = Sunday ... 6 = Saturday
  recipeId: string | null; // null = nothing planned for this slot/day
}

// A one-off swap for a specific (mealSlot, date) — e.g. "just this
// Tuesday's Meal 1, do the smoothie instead of the usual oatmeal." Takes
// priority over the default schedule for that slot on that date only, same
// idea as ScheduleOverride for workouts.
export interface MealScheduleOverride {
  id: string;
  mealSlot: number;
  date: string; // YYYY-MM-DD
  recipeId: string | null;
}

// Lightweight "I ate the planned meal" confirmation. A MealCheck existing
// for a given (mealSlot, date) means that meal was confirmed eaten — there's
// no content to it beyond that, unlike WorkoutLog/StretchLog which record
// what actually happened. You asked for a simple checkbox, not a log, so
// this intentionally has nothing to edit besides existing or not existing.
export interface MealCheck {
  id: string;
  mealSlot: number;
  date: string; // YYYY-MM-DD
}

// ---- Supplement tracker ----
// A supplement in your library — a name and optional notes (e.g. dosage,
// "take with food"). Deliberately simple, same shape as Exercise/Stretch —
// no scheduling fields, because unlike workouts/meals, every supplement in
// your library applies every day. There's no "which supplement is assigned
// to Tuesday" question to answer, so there's no default-schedule/override
// system here at all — just this library plus the flat check-off log below.
export interface Supplement {
  id: string;
  name: string;
  notes?: string;
}

// "I took this supplement on this date." A matching entry existing for
// (supplementId, date) means it was taken that day — same lightweight
// "existence = confirmed" idea as MealCheck, just keyed by supplement
// instead of meal slot (since there's no schedule to check against first).
export interface SupplementCheck {
  id: string;
  supplementId: string;
  date: string; // YYYY-MM-DD
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
  recipes: Recipe[];
  mealDefaultSchedule: MealDefaultScheduleEntry[];
  mealScheduleOverrides: MealScheduleOverride[];
  mealChecks: MealCheck[];
  supplements: Supplement[];
  supplementChecks: SupplementCheck[];
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
  recipes: [],
  // Pre-populate every (mealSlot, dayOfWeek) combination up front — same
  // reasoning as defaultSchedule/stretchDefaultSchedule above: the UI can
  // always assume an entry exists for every slot/day pair rather than
  // handling a "missing entry" case everywhere it reads the schedule.
  mealDefaultSchedule: Array.from({ length: MEAL_SLOT_COUNT }, (_, i) => i + 1).flatMap(
    (mealSlot) =>
      [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ mealSlot, dayOfWeek, recipeId: null }))
  ),
  mealScheduleOverrides: [],
  mealChecks: [],
  supplements: [],
  supplementChecks: [],
};

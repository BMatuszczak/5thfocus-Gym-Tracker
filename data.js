// Workout data + mock history.
// All weights in kg internally; converted on display via unit toggle.

// Same full-body session run twice a week (Monday + Wednesday).
const FULL_BODY_EXERCISES = [
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    kit: 'Machine, barbell, or dumbbell',
    sets: 3, reps: 10, restSec: 90,
    cue: 'Upper back on bench, weight across hips, feet flat. Push through heels to lift hips until body is flat knees-to-shoulders. Lower with control.',
  },
  {
    id: 'bulgarian',
    name: 'Bulgarian Split Squat',
    kit: 'Dumbbells, bench',
    sets: 3, reps: 8, perLeg: true, restSec: 90,
    cue: 'Stand a metre in front of bench, facing away. Top of back foot on bench. DB each hand. Lower back knee toward floor, drive through front heel. All 8 one leg, then switch.',
  },
  {
    id: 'back-extension',
    name: '45° Back Extension',
    kit: '45° hyperextension bench',
    sets: 3, reps: 12, restSec: 75, bodyweight: true,
    cue: 'Hips on the pad, ankles locked under the rollers. Hinge down at the hips, then squeeze glutes to lift until your body is straight. Don\'t overextend the lower back.',
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    kit: 'Machine or dumbbells',
    sets: 3, reps: 12, restSec: 60,
    cue: 'Balls of feet on the edge of a step or platform. Drop heels for a full stretch, then drive up onto your toes as high as you can. Slow and controlled.',
  },
  {
    id: 'chest-press',
    name: 'Machine Chest Press',
    kit: 'Machine',
    sets: 3, reps: 10, restSec: 75,
    cue: 'Adjust the seat so the handles sit at mid-chest. Press out until arms are nearly straight, squeeze, then return under control without letting the stack touch down.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    kit: 'Cable machine, wide bar',
    sets: 3, reps: 10, restSec: 75,
    cue: 'Wide overhand grip, thighs locked under the pads. Pull the bar to your upper chest, drive elbows down, squeeze the lats, release up under control.',
  },
  {
    id: 'cable-row',
    name: 'Cable Row',
    kit: 'Neutral-grip V handle',
    sets: 3, reps: 12, restSec: 75,
    cue: 'V handle, palms facing each other. Pull handle to stomach, squeeze shoulder blades, release with control.',
  },
  {
    id: 'db-lat-raise',
    name: 'DB Lateral Raise',
    kit: 'Dumbbells',
    sets: 3, reps: 12, restSec: 60,
    cue: 'Light DB in each hand, slight bend in the elbows. Raise out to the sides until your arms are level with your shoulders, lead with the elbows, lower slowly.',
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    sets: 3, reps: 10, perSide: true, restSec: 45, bodyweight: true,
    cue: 'Hands and knees, hands under shoulders, knees under hips. Extend right arm + left leg, hold 2s, return. Alternate to 10 each side.',
  },
  {
    id: 'core-finisher',
    name: 'Sit-ups / Hanging Knee Raises',
    kit: 'Mat or pull-up bar',
    sets: 3, reps: 12, restSec: 60, bodyweight: true,
    cue: 'Pick one. Sit-ups: feet anchored, curl all the way up, lower slow. Hanging knee raises: hang from the bar, pull knees up toward your chest without swinging.',
  },
  {
    id: 'reverse-wrist-curl',
    name: 'Reverse Wrist Curls',
    kit: 'Dumbbells or barbell',
    sets: 3, reps: 15, restSec: 45,
    cue: 'Forearms resting on your thighs or a bench, palms facing down, wrists just past the edge. Curl the weight up using only your wrists, lower slowly. Keep it light.',
  },
];

const WORKOUTS = {
  monday: {
    id: 'monday',
    name: 'Full Body',
    day: 'Monday',
    durationMin: 50,
    warmup: '5 min bike or rower, easy pace',
    exercises: FULL_BODY_EXERCISES,
  },
  wednesday: {
    id: 'wednesday',
    name: 'Full Body',
    day: 'Wednesday',
    durationMin: 50,
    warmup: '5 min bike or rower, easy pace',
    exercises: FULL_BODY_EXERCISES,
  },
};

// 6 weeks of history. Most recent first within each exercise array.
// Each session: { date, sets: [{w, reps, rir}] }  rir = reps in reserve
const today = new Date('2026-05-19'); // Tuesday
const daysAgo = (n) => {
  const d = new Date(today); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const HISTORY = {
  // Lower body sessions (Mondays going back)
  'goblet-squat':       [{d:1, w:20, r:[10,10,9],   rir:[2,1,0]},
                         {d:8, w:18, r:[10,10,10],  rir:[2,2,1]},
                         {d:15,w:18, r:[10,10,10],  rir:[3,2,2]},
                         {d:22,w:16, r:[10,10,10],  rir:[2,1,1]},
                         {d:29,w:16, r:[10,10,9],   rir:[2,1,0]},
                         {d:36,w:14, r:[10,10,10],  rir:[3,3,2]}],
  'rdl':                [{d:1, w:24, r:[10,10,10],  rir:[2,2,1]},
                         {d:8, w:24, r:[10,10,9],   rir:[2,1,0]},
                         {d:15,w:22, r:[10,10,10],  rir:[2,2,1]},
                         {d:22,w:22, r:[10,10,10],  rir:[3,2,2]},
                         {d:29,w:20, r:[10,10,10],  rir:[2,2,1]},
                         {d:36,w:20, r:[10,10,10],  rir:[3,3,2]}],
  'step-up':            [{d:1, w:14, r:[10,10,10],  rir:[2,2,1]},
                         {d:8, w:14, r:[10,10,10],  rir:[3,2,2]},
                         {d:15,w:12, r:[10,10,10],  rir:[2,2,1]},
                         {d:22,w:12, r:[10,10,10],  rir:[2,2,2]},
                         {d:29,w:10, r:[10,10,10],  rir:[3,2,2]},
                         {d:36,w:10, r:[10,10,10],  rir:[3,3,3]}],
  'single-leg-bridge':  [{d:1, w:0,  r:[12,12,12],  rir:[2,1,1]},
                         {d:8, w:0,  r:[12,12,12],  rir:[2,2,1]},
                         {d:15,w:0,  r:[12,12,12],  rir:[3,2,2]}],
  'side-plank':         [{d:1, w:0,  r:[30,30,28],  rir:[1,0,0]},
                         {d:8, w:0,  r:[30,30,30],  rir:[2,1,0]},
                         {d:15,w:0,  r:[30,28,25],  rir:[1,0,0]}],

  // Wednesday full body
  'hip-thrust':         [{d:6, w:60, r:[10,10,10],  rir:[2,2,1]},
                         {d:13,w:55, r:[10,10,10],  rir:[2,1,1]},
                         {d:20,w:50, r:[10,10,10],  rir:[2,2,1]},
                         {d:27,w:45, r:[10,10,10],  rir:[3,2,2]},
                         {d:34,w:40, r:[10,10,10],  rir:[3,3,2]}],
  'bulgarian':          [{d:6, w:12, r:[8,8,8],     rir:[2,2,1]},
                         {d:13,w:12, r:[8,8,8],     rir:[3,2,2]},
                         {d:20,w:10, r:[8,8,8],     rir:[2,2,2]},
                         {d:27,w:10, r:[8,8,8],     rir:[3,2,2]},
                         {d:34,w:8,  r:[8,8,8],     rir:[3,3,3]}],
  'cable-row':          [{d:6, w:35, r:[10,10,10],  rir:[2,2,1]},
                         {d:13,w:32, r:[10,10,10],  rir:[2,2,1]},
                         {d:20,w:30, r:[10,10,10],  rir:[2,2,2]},
                         {d:27,w:28, r:[10,10,10],  rir:[3,2,2]},
                         {d:34,w:25, r:[10,10,10],  rir:[3,3,2]}],
  'cable-crunch':       [{d:6, w:25, r:[12,12,12],  rir:[2,2,1]},
                         {d:13,w:22, r:[12,12,12],  rir:[2,2,1]},
                         {d:20,w:20, r:[12,12,12],  rir:[2,2,2]}],
};

// Session-level history (for streak + volume chart)
// 18 sessions in last 6 weeks (mon + wed = 12, plus a few extras / makeups)
const SESSIONS = [
  { date: daysAgo(1),  workout: 'monday',    durationMin: 42, volume: 4180 },
  { date: daysAgo(6),  workout: 'wednesday', durationMin: 58, volume: 5840 },
  { date: daysAgo(8),  workout: 'monday',    durationMin: 44, volume: 3920 },
  { date: daysAgo(13), workout: 'wednesday', durationMin: 61, volume: 5420 },
  { date: daysAgo(15), workout: 'monday',    durationMin: 46, volume: 3820 },
  { date: daysAgo(20), workout: 'wednesday', durationMin: 59, volume: 5060 },
  { date: daysAgo(22), workout: 'monday',    durationMin: 43, volume: 3600 },
  { date: daysAgo(27), workout: 'wednesday', durationMin: 60, volume: 4720 },
  { date: daysAgo(29), workout: 'monday',    durationMin: 45, volume: 3520 },
  { date: daysAgo(34), workout: 'wednesday', durationMin: 62, volume: 4380 },
  { date: daysAgo(36), workout: 'monday',    durationMin: 47, volume: 3340 },
  { date: daysAgo(41), workout: 'wednesday', durationMin: 64, volume: 4120 },
];

// Streak: count of days in last 30 with a session
const STREAK = { current: 6, longest: 9, sessionsLast30: 11 };

// Helpers
const epley = (w, reps) => w === 0 ? 0 : w * (1 + reps / 30);

// Estimated 1RM trend per exercise: use top-set of each session
const e1RMTrend = (exId) => {
  const sess = HISTORY[exId] || [];
  return sess.slice().reverse().map((s) => ({
    daysAgo: s.d,
    e1RM: Math.round(epley(s.w, Math.max(...s.r)) * 10) / 10,
  }));
};

// Last session of an exercise
const lastSession = (exId) => (HISTORY[exId] || [])[0];

window.WORKOUTS = WORKOUTS;
window.HISTORY = HISTORY;
window.SESSIONS = SESSIONS;
window.STREAK = STREAK;
window.epley = epley;
window.e1RMTrend = e1RMTrend;
window.lastSession = lastSession;

// persistence.js — localStorage wrapper for gym tracker
// All data lives under a single root key for easy export/import.

const STORE_KEY = 'gymtracker_v1';

const defaultStore = () => ({
  version: 1,
  // Completed sets, keyed by `${date}__${exId}__${setIdx}`. Newest at end.
  // We also keep a sessions array for fast aggregation.
  sets: [],     // [{ date, workoutId, exId, setIdx, weightKg, reps, rir, completedAt }]
  sessions: [], // [{ date, workoutId, durationMin, volume, startedAt, completedAt }]
  // Current in-progress workout — survives refresh.
  active: null, // { workoutId, startedAt, sets: { exId: [{weightKg,reps,completed,rir}] }, usingAlt: {} }
});

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultStore();
    const p = JSON.parse(raw);
    return { ...defaultStore(), ...p };
  } catch {
    return defaultStore();
  }
}

function save(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to persist:', e);
  }
}

// Mutators
const Store = {
  get: load,
  set: save,
  patch(fn) {
    const s = load();
    const next = fn(s) || s;
    save(next);
    return next;
  },

  recordSession(session) {
    const s = load();
    s.sessions = [session, ...s.sessions];
    s.active = null;
    save(s);
    return s;
  },

  recordSet(setData) {
    const s = load();
    s.sets.push(setData);
    save(s);
    return s;
  },

  saveActive(active) {
    const s = load();
    s.active = active;
    save(s);
    return s;
  },

  clearActive() {
    const s = load();
    s.active = null;
    save(s);
    return s;
  },

  reset() {
    save(defaultStore());
  },

  export() {
    return JSON.stringify(load(), null, 2);
  },

  import(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid data');
      const merged = { ...defaultStore(), ...parsed };
      save(merged);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  // Derived: last session for an exercise (combines real sets + mock history)
  realSessionsByExercise(exId) {
    const s = load();
    // Group sets by date for this exercise
    const byDate = {};
    s.sets.filter(x => x.exId === exId).forEach(x => {
      if (!byDate[x.date]) byDate[x.date] = [];
      byDate[x.date].push(x);
    });
    return Object.entries(byDate)
      .map(([date, sets]) => {
        const sorted = sets.slice().sort((a, b) => a.setIdx - b.setIdx);
        return {
          date,
          w: sorted[0]?.weightKg || 0,
          r: sorted.map(x => x.reps),
          rir: sorted.map(x => x.rir ?? 2),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};

// React hook for subscribing to store
function useStore() {
  const [state, setState] = React.useState(load());
  const refresh = React.useCallback(() => setState(load()), []);
  React.useEffect(() => {
    const onStorage = (e) => { if (e.key === STORE_KEY) refresh(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);
  return [state, refresh];
}

window.Store = Store;
window.useStore = useStore;
window.STORE_KEY = STORE_KEY;

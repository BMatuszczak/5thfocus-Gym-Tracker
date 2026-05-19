// Active workout flow

function Workout({ workoutId, unit, onExit, onComplete }) {
  const workout = WORKOUTS[workoutId];

  // Pre-fill from last session
  const buildInitialSets = (exercise) => {
    const last = lastSession(exercise.id);
    const startKg = last ? last.w : (exercise.bodyweight ? 0 : 10);
    return Array.from({ length: exercise.sets }).map(() => ({
      weightKg: startKg,
      reps: exercise.reps || exercise.holdSec || 0,
      completed: false,
    }));
  };

  // Hydrate from persisted active workout if present (and same workout id)
  const persisted = React.useMemo(() => {
    const a = Store.get().active;
    return (a && a.workoutId === workoutId) ? a : null;
  }, [workoutId]);

  const [exIdx, setExIdx] = React.useState(persisted?.exIdx ?? 0);
  const ex = workout.exercises[exIdx];
  const startedAt = React.useRef(persisted?.startedAt || Date.now());

  const [sets, setSets] = React.useState(() => {
    if (persisted?.sets) return persisted.sets;
    const o = {};
    workout.exercises.forEach(e => { o[e.id] = buildInitialSets(e); });
    return o;
  });

  const [usingAlt, setUsingAlt] = React.useState(persisted?.usingAlt || {}); // exId -> bool
  const [expanded, setExpanded] = React.useState(new Set([ex.id])); // cue panels open by default for first
  const [resting, setResting] = React.useState(null); // { exId, restSec, startedAt }
  const [warmupDone, setWarmupDone] = React.useState(persisted?.warmupDone || false);

  // Persist active workout state on any change
  React.useEffect(() => {
    Store.saveActive({
      workoutId, exIdx, sets, usingAlt, warmupDone,
      startedAt: startedAt.current,
    });
  }, [workoutId, exIdx, sets, usingAlt, warmupDone]);

  // Keep screen awake during workouts; release on unmount
  React.useEffect(() => {
    window.requestWakeLock?.();
    return () => window.releaseWakeLock?.();
  }, []);

  const completeSet = (exId, setIdx) => {
    setSets(prev => {
      const next = { ...prev };
      next[exId] = next[exId].map((s, i) => i === setIdx ? { ...s, completed: true } : s);
      return next;
    });
    // haptic
    if (navigator.vibrate) navigator.vibrate(15);
    // start rest timer
    const exercise = workout.exercises.find(e => e.id === exId);
    setResting({ exId, restSec: exercise.restSec, startedAt: Date.now() });
  };

  const uncompleteSet = (exId, setIdx) => {
    setSets(prev => {
      const next = { ...prev };
      next[exId] = next[exId].map((s, i) => i === setIdx ? { ...s, completed: false } : s);
      return next;
    });
  };

  const updateSet = (exId, setIdx, patch) => {
    setSets(prev => {
      const next = { ...prev };
      next[exId] = next[exId].map((s, i) => i === setIdx ? { ...s, ...patch } : s);
      return next;
    });
  };

  const goExercise = (dir) => {
    setExIdx(prev => {
      const n = Math.max(0, Math.min(workout.exercises.length - 1, prev + dir));
      // auto-expand new exercise cues
      setExpanded(s => new Set([...s, workout.exercises[n].id]));
      return n;
    });
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Overall progress
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = Object.values(sets).flat().filter(s => s.completed).length;

  // Are we fully complete?
  const allDone = doneSets >= totalSets;

  // On full completion, persist session and clear active state
  const persistComplete = React.useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const volume = Object.entries(sets).reduce((acc, [_, sList]) => {
      return acc + sList.reduce((a, s) => a + (s.weightKg || 0) * (s.reps || 0), 0);
    }, 0);
    const durationMin = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    // Save individual sets
    Object.entries(sets).forEach(([exId, sList]) => {
      sList.forEach((s, idx) => {
        if (s.completed) {
          Store.recordSet({
            date: today, workoutId, exId, setIdx: idx,
            weightKg: s.weightKg, reps: s.reps, rir: s.rir ?? null,
            completedAt: Date.now(),
          });
        }
      });
    });
    Store.recordSession({
      date: today, workoutId, durationMin, volume,
      startedAt: startedAt.current, completedAt: Date.now(),
    });
  }, [sets, workoutId]);

  if (allDone) {
    return <WorkoutComplete workout={workout} sets={sets} unit={unit}
      onDone={() => { persistComplete(); onComplete(); }} />;
  }

  return (
    <div className="gt-app" style={{ background: 'var(--bg)' }}>
      <div className="gt-scroll" style={{ paddingBottom: 28 }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '4px 16px 14px',
        }}>
          <button className="gt-btn gt-btn-ghost" style={{ padding: 10, borderRadius: 12 }} onClick={onExit}>
            <Icon name="x" size={18} stroke="var(--text-2)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="gt-caption" style={{ fontSize: 10 }}>{workout.day} · {workout.name}</div>
            <div style={{
              marginTop: 6, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(doneSets / totalSets) * 100}%`,
                height: '100%', background: 'var(--accent)',
                transition: 'width 0.3s', borderRadius: 99,
              }} />
            </div>
          </div>
          <div className="gt-mono gt-tnum" style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 44, textAlign: 'right' }}>
            {doneSets}/{totalSets}
          </div>
        </div>

        {/* Warmup banner (collapses after first interaction) */}
        {!warmupDone && exIdx === 0 && (
          <div className="gt-section" style={{ marginBottom: 14 }}>
            <div className="gt-card gt-tap" style={{
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface-2)', borderColor: 'transparent',
            }} onClick={() => setWarmupDone(true)}>
              <div style={{
                width: 34, height: 34, borderRadius: 99, background: 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="clock" size={16} stroke="var(--text-2)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Warm up first</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{workout.warmup}</div>
              </div>
              <Icon name="check" size={14} stroke="var(--text-3)" />
            </div>
          </div>
        )}

        {/* Exercise list — current + completed/upcoming as cards */}
        <div className="gt-section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workout.exercises.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={sets[exercise.id]}
              isCurrent={i === exIdx}
              isCompleted={sets[exercise.id].every(s => s.completed)}
              index={i}
              total={workout.exercises.length}
              expanded={expanded.has(exercise.id)}
              onToggleExpanded={() => toggleExpanded(exercise.id)}
              onActivate={() => setExIdx(i)}
              usingAlt={usingAlt[exercise.id]}
              onSwap={() => setUsingAlt(p => ({ ...p, [exercise.id]: !p[exercise.id] }))}
              onCompleteSet={(idx) => completeSet(exercise.id, idx)}
              onUncompleteSet={(idx) => uncompleteSet(exercise.id, idx)}
              onUpdateSet={(idx, patch) => updateSet(exercise.id, idx, patch)}
              unit={unit}
            />
          ))}
        </div>

        {/* Mobility note (Wednesday only) */}
        {workout.mobility && (
          <div className="gt-section" style={{ marginTop: 16 }}>
            <div className="gt-card" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}>
              <div className="gt-caption" style={{ marginBottom: 10 }}>After · {workout.mobility.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workout.mobility.items.map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)' }}>{m.name}</span>
                    <span className="gt-mono" style={{ color: 'var(--text-3)', fontSize: 12 }}>{m.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {resting && (
        <RestOverlay
          restSec={resting.restSec}
          startedAt={resting.startedAt}
          nextExercise={(() => {
            const exId = resting.exId;
            const currentIdx = workout.exercises.findIndex(e => e.id === exId);
            const currentEx = workout.exercises[currentIdx];
            const currentSets = sets[exId];
            const remainingSets = currentSets.filter(s => !s.completed).length;
            if (remainingSets > 0) {
              const nextSetIdx = currentSets.findIndex(s => !s.completed);
              return {
                label: `Up next · Set ${nextSetIdx + 1} of ${currentEx.sets}`,
                exName: currentEx.name,
                target: `${fmtW(currentSets[nextSetIdx].weightKg, unit)} × ${currentSets[nextSetIdx].reps}`,
              };
            }
            // next exercise
            const nextEx = workout.exercises[currentIdx + 1];
            if (!nextEx) return { label: 'Last set complete', exName: 'Session complete', target: '' };
            return {
              label: `Up next · ${nextEx.name}`,
              exName: nextEx.name,
              target: `${nextEx.sets} × ${nextEx.reps || nextEx.holdSec + 's'}${nextEx.perLeg || nextEx.perSide ? ' each' : ''}`,
            };
          })()}
          onSkip={() => {
            setResting(null);
            // advance to next exercise if all sets done in current
            const cur = sets[resting.exId];
            if (cur.every(s => s.completed)) {
              const curIdx = workout.exercises.findIndex(e => e.id === resting.exId);
              if (curIdx < workout.exercises.length - 1) {
                setExIdx(curIdx + 1);
                setExpanded(s => new Set([...s, workout.exercises[curIdx + 1].id]));
              }
            }
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ExerciseCard({
  exercise, sets, isCurrent, isCompleted, index, total, expanded,
  onToggleExpanded, onActivate, usingAlt, onSwap,
  onCompleteSet, onUncompleteSet, onUpdateSet, unit,
}) {
  const displayEx = usingAlt && exercise.alt
    ? { ...exercise, name: exercise.alt.name, cue: exercise.alt.cue, id: exercise.id }
    : exercise;
  const last = lastSession(exercise.id);

  return (
    <div className="gt-card" style={{
      padding: 0, overflow: 'hidden',
      opacity: isCompleted && !isCurrent ? 0.55 : 1,
      borderColor: isCurrent ? 'var(--border-2)' : 'var(--border)',
      transition: 'opacity 0.2s',
    }}>
      {/* Header */}
      <div className="gt-tap" onClick={!isCurrent ? onActivate : undefined} style={{
        padding: '16px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="gt-caption" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
              {index + 1} of {total}
            </div>
            {isCompleted && (
              <span className="gt-pill" style={{ padding: '2px 8px', fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Icon name="check" size={10} stroke="var(--accent)" />done
              </span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {displayEx.name}
          </div>
          {exercise.kit && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{exercise.kit}</div>
          )}
          {last && isCurrent && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-3)' }}>Last:</span>
              <span className="gt-mono gt-tnum" style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                {fmtW(last.w, unit)} × {last.r[0]}
              </span>
              <span style={{ color: 'var(--text-4)' }}>·</span>
              <span className="gt-mono" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{last.rir[0]} RIR</span>
            </div>
          )}
        </div>
        {isCurrent && exercise.alt && (
          <button className="gt-pill gt-tap" style={{
            fontSize: 11, padding: '6px 10px',
            background: usingAlt ? 'var(--accent-soft)' : 'var(--surface-2)',
            color: usingAlt ? 'var(--accent)' : 'var(--text-2)',
          }} onClick={(e) => { e.stopPropagation(); onSwap(); }}>
            <Icon name="swap" size={12} stroke="currentColor" />
            {usingAlt ? 'Original' : 'Swap'}
          </button>
        )}
      </div>

      {isCurrent && (
        <>
          {/* Cues accordion */}
          <div style={{ padding: '0 18px' }}>
            <button className="gt-tap" onClick={onToggleExpanded} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 0', background: 'none', border: 'none',
              color: 'var(--text-3)', fontSize: 12, fontFamily: 'inherit',
              cursor: 'pointer', borderTop: '1px solid var(--border)',
            }}>
              <Icon name="info" size={13} stroke="var(--text-3)" />
              <span style={{ flex: 1, textAlign: 'left' }}>Form cues</span>
              <Icon name={expanded ? 'chevU' : 'chevD'} size={14} stroke="var(--text-3)" />
            </button>
            {expanded && (
              <div style={{
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55,
                paddingBottom: 14, textWrap: 'pretty',
              }}>
                {displayEx.cue}
                {usingAlt && exercise.alt && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                    Substitution: {exercise.alt.when}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sets */}
          <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sets.map((s, i) => {
              const firstIncomplete = sets.findIndex(x => !x.completed);
              const isActive = i === firstIncomplete;
              const repsLabel = exercise.holdSec ? `${s.reps}s` : `${s.reps}`;
              return (
                <SetRow
                  key={i}
                  num={i + 1}
                  weightKg={s.weightKg}
                  reps={s.reps}
                  completed={s.completed}
                  isActive={isActive}
                  exercise={exercise}
                  unit={unit}
                  onChangeWeight={(v) => onUpdateSet(i, { weightKg: v })}
                  onChangeReps={(v) => onUpdateSet(i, { reps: v })}
                  onComplete={() => onCompleteSet(i)}
                  onUncomplete={() => onUncompleteSet(i)}
                />
              );
            })}
          </div>

          <div style={{
            padding: '0 18px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--text-3)', gap: 12,
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>Rest {exercise.restSec}s between sets</span>
            <span className="gt-mono" style={{ whiteSpace: 'nowrap' }}>{exercise.perLeg ? 'per leg' : exercise.perSide ? 'per side' : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SetRow({ num, weightKg, reps, completed, isActive, exercise, unit, onChangeWeight, onChangeReps, onComplete, onUncomplete }) {
  const state = completed ? 'done' : isActive ? 'active' : 'pending';
  const weightDisplay = toUnit(weightKg, unit);
  const weightStep = unit === 'lb' ? 2.5 : 1.25;

  return (
    <div className="gt-set" data-state={state}>
      <div className="gt-set-num">{num}</div>
      {exercise.bodyweight && weightKg === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="gt-mono" style={{ fontSize: 14, color: state === 'done' ? 'var(--text-3)' : 'var(--text-2)' }}>BW</span>
          <span style={{ color: 'var(--text-4)', fontSize: 12 }}>×</span>
          <Stepper
            value={reps}
            onChange={onChangeReps}
            step={1}
            min={1}
            unit={exercise.holdSec ? 's' : ''}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stepper
            value={weightDisplay}
            onChange={(v) => onChangeWeight(fromUnit(v, unit))}
            step={weightStep}
            min={0}
            unit={unit}
          />
          <span style={{ color: 'var(--text-4)', fontSize: 12 }}>×</span>
          <div className="gt-mono gt-tnum" style={{
            fontSize: 17, fontWeight: 500,
            background: 'var(--surface-2)', padding: '8px 14px', borderRadius: 12,
            color: state === 'done' ? 'var(--text-3)' : 'var(--text)',
            minWidth: 50, textAlign: 'center',
          }}>{reps}</div>
        </div>
      )}
      <button className="gt-check" data-checked={completed} onClick={completed ? onUncomplete : onComplete}
        aria-label={completed ? 'Mark incomplete' : 'Complete set'}>
        <Icon name="check" size={22} stroke={completed ? 'var(--accent-text)' : 'var(--text-3)'} strokeWidth={completed ? 2.4 : 1.8} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function RestOverlay({ restSec, startedAt, nextExercise, onSkip }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startedAt]);

  const remaining = Math.max(0, restSec - elapsed);
  const pct = Math.min(1, elapsed / restSec);
  const overrun = elapsed > restSec;

  // haptic at 10s, 0s
  const hapticAt = React.useRef({ ten: false, zero: false });
  React.useEffect(() => {
    if (!hapticAt.current.ten && remaining === 10) {
      hapticAt.current.ten = true;
      if (navigator.vibrate) navigator.vibrate([15, 60, 15]);
    }
    if (!hapticAt.current.zero && remaining === 0) {
      hapticAt.current.zero = true;
      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
    }
  }, [remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const timeStr = `${mm}:${String(ss).padStart(2, '0')}`;
  const overStr = `+${Math.floor((elapsed - restSec) / 60)}:${String((elapsed - restSec) % 60).padStart(2, '0')}`;

  return (
    <div className="gt-rest">
      <div style={{ position: 'absolute', top: 70, left: 20, right: 20, textAlign: 'center' }}>
        <div className="gt-caption" style={{ color: 'var(--text-3)', marginBottom: 4 }}>
          {overrun ? 'Resting (overtime)' : 'Resting'}
        </div>
      </div>

      <div style={{ position: 'relative', width: 240, height: 240, marginBottom: 28 }}>
        <ProgressRing
          value={pct}
          max={1}
          size={240}
          stroke={4}
          color={overrun ? 'var(--warn)' : 'var(--accent)'}
          track="var(--surface-2)"
        />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="gt-mono gt-tnum" style={{
            fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em',
            color: overrun ? 'var(--warn)' : 'var(--text)',
          }}>
            {overrun ? overStr : timeStr}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap' }}>
            of {Math.floor(restSec / 60)}:{String(restSec % 60).padStart(2, '0')} target
          </div>
        </div>
      </div>

      {/* Next up */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '14px 18px',
        width: '100%', maxWidth: 320, marginBottom: 18,
      }}>
        <div className="gt-caption" style={{ fontSize: 10, marginBottom: 6 }}>{nextExercise.label}</div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{nextExercise.exName}</div>
        {nextExercise.target && (
          <div className="gt-mono gt-tnum" style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{nextExercise.target}</div>
        )}
      </div>

      <button className="gt-btn gt-btn-primary gt-btn-lg" style={{ width: '100%', maxWidth: 320 }} onClick={onSkip}>
        {overrun ? "Let's go" : 'Skip rest'}
      </button>

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 16 }}>
        <button className="gt-tap" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}>+15s</button>
        <button className="gt-tap" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}>−15s</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function WorkoutComplete({ workout, sets, unit, onDone }) {
  const totalVol = Object.entries(sets).reduce((acc, [exId, sList]) => {
    return acc + sList.reduce((a, s) => a + (s.weightKg || 0) * (s.reps || 0), 0);
  }, 0);
  const totalSets = Object.values(sets).flat().length;

  return (
    <div className="gt-app">
      <div className="gt-scroll" style={{ padding: '80px 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 90, height: 90, borderRadius: 99,
          background: 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Icon name="check" size={48} stroke="var(--accent)" strokeWidth={2.6} />
        </div>
        <div className="gt-caption" style={{ marginBottom: 8 }}>Session complete</div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
          {workout.name}
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 36 }}>
          Nice work. Logged and on your record.
        </div>

        <div style={{
          width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 36,
        }}>
          {[
            { v: totalSets, label: 'Sets' },
            { v: workout.exercises.length, label: 'Exercises' },
            { v: `${(totalVol / 1000).toFixed(1)}t`, label: 'Volume' },
          ].map(s => (
            <div key={s.label} className="gt-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
              <div className="gt-mono gt-tnum" style={{ fontSize: 24, fontWeight: 500 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button className="gt-btn gt-btn-primary gt-btn-lg" style={{ width: '100%' }} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

window.Workout = Workout;

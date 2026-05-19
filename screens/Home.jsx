// Home / Today screen — shows next session + stats + last session recap

function Home({ unit, useDemo = true, onStart, demoDay, onOpenSettings }) {
  const isWorkoutDay = demoDay === 'workout';
  const workout = isWorkoutDay ? WORKOUTS.wednesday : WORKOUTS.wednesday;

  // Real sessions take priority. If demo is off and no real ones yet, render empty state.
  const realSessions = Store.get().sessions;
  const sessionsAvail = useDemo ? SESSIONS : realSessions;
  const lastSess = sessionsAvail[0];
  const lastWorkout = lastSess ? WORKOUTS[lastSess.workout] : null;

  // PR check (only if using demo)
  const lastPRs = [];
  if (useDemo) {
    Object.keys(HISTORY).forEach(exId => {
      const sess = HISTORY[exId];
      if (sess.length < 2) return;
      const top = Math.max(...sess[0].r.map((reps, i) => epley(sess[0].w, reps)));
      const prev = Math.max(...sess.slice(1).flatMap(s => s.r.map(r => epley(s.w, r))));
      if (top > prev) {
        const ex = [...WORKOUTS.monday.exercises, ...WORKOUTS.wednesday.exercises].find(e => e.id === exId);
        if (ex) lastPRs.push({ ex, delta: Math.round((top - prev) * 10) / 10 });
      }
    });
  }

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);

  // 4-week vs prior 4-week volume (only meaningful with demo data for now)
  const wkVol = useDemo ? SESSIONS.slice(0, 4).reduce((a, s) => a + s.volume, 0)
                        : realSessions.slice(0, 4).reduce((a, s) => a + s.volume, 0);
  const prevWkVol = useDemo ? SESSIONS.slice(4, 8).reduce((a, s) => a + s.volume, 0) : 0;
  const volDelta = prevWkVol > 0 ? Math.round(((wkVol - prevWkVol) / prevWkVol) * 100) : 0;

  const streak = useDemo ? STREAK : { current: 0, longest: 0, sessionsLast30: realSessions.length };

  return (
    <div className="gt-scroll">
      {/* Header */}
      <div className="gt-section" style={{ paddingTop: 4, paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="gt-caption">{isWorkoutDay ? 'Today · Wed May 20' : 'Tuesday, May 19'}</div>
            <div style={{ fontSize: 32, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>
              {isWorkoutDay ? 'Time to lift.' : 'Recovery day.'}
            </div>
          </div>
          <button className="gt-btn gt-btn-ghost" style={{ padding: 10, borderRadius: 12 }} onClick={onOpenSettings}>
            <Icon name="settings" size={18} stroke="var(--text-2)" />
          </button>
        </div>
      </div>

      {/* Today's / Next session — hero card */}
      <div className="gt-section" style={{ marginBottom: 14 }}>
        <div className="gt-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="gt-pill gt-pill-accent" style={{ whiteSpace: 'nowrap' }}>
                <Icon name="dot" size={10} stroke="var(--accent)" />
                {isWorkoutDay ? 'Today' : 'Tomorrow · Wed'}
              </span>
              <span className="gt-pill" style={{ whiteSpace: 'nowrap' }}><Icon name="clock" size={12} stroke="currentColor" />~{workout.durationMin} min</span>
            </div>
            <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              {workout.name}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>
              {workout.exercises.length} exercises · {totalSets} sets
            </div>

            {/* exercise preview row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '20px 0 22px' }}>
              {workout.exercises.slice(0, 6).map(e => (
                <div key={e.id} style={{
                  fontSize: 12, padding: '6px 10px',
                  background: 'var(--surface-2)', borderRadius: 99,
                  color: 'var(--text-2)', whiteSpace: 'nowrap',
                }}>{e.name}</div>
              ))}
            </div>

            <button className="gt-btn gt-btn-primary gt-btn-lg" style={{ width: '100%' }} onClick={onStart}>
              <Icon name="play" size={16} stroke="var(--accent-text)" />
              {isWorkoutDay ? 'Start workout' : 'Start session early'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="gt-section" style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="gt-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="flame" size={14} stroke="var(--accent)" />
              <div className="gt-caption" style={{ fontSize: 10 }}>Streak</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="gt-mono gt-tnum" style={{ fontSize: 28, fontWeight: 500 }}>{streak.current}</span>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{streak.current === 1 ? 'week' : 'weeks'}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              {streak.sessionsLast30} sessions · last 30d
            </div>
          </div>
          <div className="gt-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="bolt" size={14} stroke="var(--accent)" />
              <div className="gt-caption" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Volume · 4wk</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="gt-mono gt-tnum" style={{ fontSize: 28, fontWeight: 500 }}>{(wkVol / 1000).toFixed(1)}</span>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>t</span>
            </div>
            <div style={{ fontSize: 11, color: volDelta > 0 ? 'var(--good)' : 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
              {volDelta > 0 && <Icon name="arrowUp" size={10} stroke="var(--good)" />}
              {volDelta > 0 ? '+' : ''}{volDelta}% vs prior 4 wk
            </div>
          </div>
        </div>
      </div>

      {/* New PRs banner */}
      {lastPRs.length > 0 && (
        <div className="gt-section" style={{ marginBottom: 14 }}>
          <div className="gt-card" style={{
            background: 'var(--warn-soft)',
            borderColor: 'transparent',
            padding: '14px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="trophy" size={20} stroke="var(--warn)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--warn)' }}>
                  {lastPRs.length} new {lastPRs.length === 1 ? 'PR' : 'PRs'} from Monday
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {lastPRs.slice(0, 2).map(p => p.ex.name).join(', ')}{lastPRs.length > 2 ? '…' : ''}
                </div>
              </div>
              <Icon name="chevR" size={16} stroke="var(--text-3)" />
            </div>
          </div>
        </div>
      )}

      {/* Last session recap */}
      {lastSess && lastWorkout ? (
        <div className="gt-section" style={{ marginBottom: 14 }}>
          <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>Last session</div>
          <div className="gt-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{lastWorkout.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, whiteSpace: 'nowrap' }}>
                  {useDemo ? 'Yesterday' : new Date(lastSess.date).toLocaleDateString('en', { weekday: 'long' })} · {lastSess.durationMin} min
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="gt-mono gt-tnum" style={{ fontSize: 22, fontWeight: 500 }}>
                  {(lastSess.volume / 1000).toFixed(1)}t
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>volume</div>
              </div>
            </div>
            {useDemo && (
              <>
                <div className="gt-divider" style={{ margin: '14px -2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lastWorkout.exercises.slice(0, 3).map(e => {
                    const h = HISTORY[e.id];
                    if (!h) return null;
                    const s = h[0];
                    const isPR = lastPRs.some(p => p.ex.id === e.id);
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, fontSize: 14, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                        <div className="gt-mono gt-tnum" style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {fmtW(s.w, unit)} × {s.r[0]}
                        </div>
                        {isPR && <span className="gt-pill gt-pill-pr" style={{ padding: '2px 6px', fontSize: 10 }}>PR</span>}
                      </div>
                    );
                  })}
                  {lastWorkout.exercises.length > 3 && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>
                      + {lastWorkout.exercises.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="gt-section" style={{ marginBottom: 14 }}>
          <div className="gt-card" style={{ padding: '24px 18px', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99, background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <Icon name="dumbbell" size={20} stroke="var(--text-3)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No sessions logged yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>
              Your first workout will appear here.<br/>Tap "Start" above to begin.
            </div>
          </div>
        </div>
      )}

      {/* This week schedule */}
      <div className="gt-section" style={{ marginBottom: 14 }}>
        <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>This week</div>
        <div className="gt-card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { d: 'Mon', dt: 18, w: 'Lower Body', state: 'done' },
            { d: 'Tue', dt: 19, w: 'Rest', state: isWorkoutDay ? 'past' : 'today' },
            { d: 'Wed', dt: 20, w: 'Full Body', state: isWorkoutDay ? 'today' : 'next' },
            { d: 'Thu', dt: 21, w: 'Rest', state: 'planned' },
            { d: 'Fri', dt: 22, w: 'Optional', state: 'planned' },
          ].map((r, i, arr) => (
            <div key={r.d} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: 36, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.d}</div>
                <div className="gt-mono" style={{ fontSize: 17, fontWeight: 500 }}>{r.dt}</div>
              </div>
              <div style={{ flex: 1, fontSize: 14, color: r.w === 'Rest' || r.w === 'Optional' ? 'var(--text-3)' : 'var(--text)' }}>
                {r.w}
              </div>
              {r.state === 'done' && (
                <span className="gt-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11 }}>
                  <Icon name="check" size={11} stroke="var(--accent)" />done
                </span>
              )}
              {r.state === 'today' && (
                <span className="gt-pill gt-pill-accent" style={{ fontSize: 11 }}>Today</span>
              )}
              {r.state === 'next' && (
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Tomorrow</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Home = Home;

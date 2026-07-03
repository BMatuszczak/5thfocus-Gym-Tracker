// Home / Today screen — shows next session + stats + last session recap

function Home({ unit, useDemo = true, onStartWorkout, demoDay, onOpenSettings }) {
  const [showPicker, setShowPicker] = React.useState(false);
  const [showAllReal, setShowAllReal] = React.useState(false);
  const [showAllDemo, setShowAllDemo] = React.useState(false);
  const pageRef = React.useRef(null);

  const [animStreak, setAnimStreak] = React.useState(0);
  const [animVol, setAnimVol] = React.useState(0);

  React.useEffect(() => {
    if (!window.gsap) return;
    const el = pageRef.current;
    if (!el) return;
    const sections = el.querySelectorAll(':scope > .gt-section');
    gsap.fromTo(sections,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', clearProps: 'opacity,y' }
    );
  }, []);

  React.useEffect(() => {
    if (!window.gsap) { setAnimStreak(streak.current); return; }
    const s = { val: 0 };
    gsap.to(s, {
      val: streak.current, duration: 0.8, ease: 'power2.out',
      onUpdate: () => setAnimStreak(Math.round(s.val)),
    });
  }, []);

  React.useEffect(() => {
    if (!window.gsap) { setAnimVol(+(wkVol / 1000).toFixed(1)); return; }
    const s = { val: 0 };
    gsap.to(s, {
      val: +(wkVol / 1000).toFixed(1), duration: 0.8, ease: 'power2.out',
      onUpdate: () => setAnimVol(Math.round(s.val * 10) / 10),
    });
  }, []);

  const demoDate = new Date('2026-05-19');
  const today = useDemo ? demoDate : new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dayIdx = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const isWorkoutDay = useDemo ? demoDay === 'workout' : (dayIdx === 1 || dayIdx === 3);

  const getWorkout = () => {
    if (isWorkoutDay) {
      if (useDemo) return WORKOUTS.wednesday;
      return dayIdx === 1 ? WORKOUTS.monday : WORKOUTS.wednesday;
    }
    if (dayIdx <= 1 || dayIdx === 0) return WORKOUTS.monday;
    return WORKOUTS.wednesday;
  };
  const workout = getWorkout();

  const realSessions = Store.get().sessions;
  const sessionsAvail = useDemo ? SESSIONS : realSessions;
  const lastSess = sessionsAvail[0];
  const lastWorkout = lastSess ? WORKOUTS[lastSess.workout || lastSess.workoutId] : null;

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

  const wkVol = useDemo ? SESSIONS.slice(0, 4).reduce((a, s) => a + s.volume, 0)
                        : realSessions.slice(0, 4).reduce((a, s) => a + s.volume, 0);
  const prevWkVol = useDemo ? SESSIONS.slice(4, 8).reduce((a, s) => a + s.volume, 0) : 0;
  const volDelta = prevWkVol > 0 ? Math.round(((wkVol - prevWkVol) / prevWkVol) * 100) : 0;

  const streak = useDemo ? STREAK : { current: 0, longest: 0, sessionsLast30: realSessions.length };

  // Build dynamic schedule
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const scheduleDef = [
    { d: 'Mon', w: WORKOUTS.monday.name },
    { d: 'Tue', w: 'Rest' },
    { d: 'Wed', w: WORKOUTS.wednesday.name },
    { d: 'Thu', w: 'Rest' },
    { d: 'Fri', w: 'Optional' },
  ];
  const scheduleDays = scheduleDef.map((item, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dt = d.getDate();
    const isRest = item.w === 'Rest' || item.w === 'Optional';
    const hasSession = sessionsAvail.some(s => s.date === dateStr);
    let state;
    if (dateStr === todayStr) {
      state = isRest ? 'today-rest' : 'today';
    } else if (dateStr < todayStr) {
      if (hasSession) state = 'done';
      else if (!isRest) state = 'missed';
      else state = 'past';
    } else {
      state = isRest ? 'planned' : 'next';
    }
    return { ...item, dt, state, dateStr };
  });

  // Real session last workout set details
  const lastRealSets = React.useMemo(() => {
    if (useDemo || !lastSess) return null;
    const allSets = Store.get().sets;
    const wid = lastSess.workout || lastSess.workoutId;
    const sessionSets = allSets.filter(s => s.date === lastSess.date && s.workoutId === wid);
    const grouped = {};
    sessionSets.forEach(s => {
      if (!grouped[s.exId]) grouped[s.exId] = [];
      grouped[s.exId].push(s);
    });
    return grouped;
  }, [lastSess, useDemo]);

  const displayToday = useDemo
    ? (demoDay === 'workout' ? new Date('2026-05-20') : new Date('2026-05-19'))
    : today;
  const displayDateStr = displayToday.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="gt-scroll" ref={pageRef}>
        {/* Header */}
        <div className="gt-section" style={{ paddingTop: 4, paddingBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="gt-caption">{isWorkoutDay ? `Today \u00B7 ${displayDateStr}` : displayDateStr}</div>
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
                  {isWorkoutDay ? 'Today' : 'Next session'}
                </span>
                <span className="gt-pill" style={{ whiteSpace: 'nowrap' }}><Icon name="clock" size={12} stroke="currentColor" />~{workout.durationMin} min</span>
              </div>
              <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                {workout.name}
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>
                {workout.exercises.length} exercises {'\u00B7'} {totalSets} sets
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '20px 0 22px' }}>
                {workout.exercises.slice(0, 6).map(e => (
                  <div key={e.id} style={{
                    fontSize: 12, padding: '6px 10px',
                    background: 'var(--surface-2)', borderRadius: 99,
                    color: 'var(--text-2)', whiteSpace: 'nowrap',
                  }}>{e.name}</div>
                ))}
              </div>

              <button className="gt-btn gt-btn-primary gt-btn-lg" style={{ width: '100%' }} onClick={() => setShowPicker(true)}>
                <Icon name="play" size={16} stroke="var(--accent-text)" />
                {isWorkoutDay ? 'Start workout' : 'Start session early'}
              </button>
            </div>
          </div>
        </div>

        {/* Workout picker overlay */}
        {showPicker && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }} onClick={() => setShowPicker(false)}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 22,
              padding: 24,
              width: '100%', maxWidth: 340,
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Pick a workout</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Choose which session to start
              </div>
              {['monday', 'wednesday'].map(id => (
                <button key={id} className="gt-btn gt-btn-lg" style={{
                  width: '100%', marginBottom: 10,
                  background: workout.id === id ? 'var(--accent)' : 'var(--surface-2)',
                  color: workout.id === id ? 'var(--accent-text)' : 'var(--text)',
                  justifyContent: 'space-between',
                }} onClick={() => { setShowPicker(false); onStartWorkout(id); }}>
                  <span>{WORKOUTS[id].day} {'\u00B7'} {WORKOUTS[id].name}</span>
                  <Icon name="play" size={14} stroke={workout.id === id ? 'var(--accent-text)' : 'var(--text-2)'} />
                </button>
              ))}
              <button className="gt-btn" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)' }}
                onClick={() => setShowPicker(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick stats row */}
        <div className="gt-section" style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="flame" size={14} stroke="var(--accent)" />
                <div className="gt-caption" style={{ fontSize: 10 }}>Streak</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="gt-mono gt-tnum" style={{ fontSize: 28, fontWeight: 500 }}>{animStreak}</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{streak.current === 1 ? 'week' : 'weeks'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                {streak.sessionsLast30} sessions {'\u00B7'} last 30d
              </div>
            </div>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="bolt" size={14} stroke="var(--accent)" />
                <div className="gt-caption" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Volume {'\u00B7'} 4wk</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="gt-mono gt-tnum" style={{ fontSize: 28, fontWeight: 500 }}>{animVol.toFixed(1)}</span>
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
                    {lastPRs.length} new {lastPRs.length === 1 ? 'PR' : 'PRs'} from last session
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {lastPRs.slice(0, 2).map(p => p.ex.name).join(', ')}{lastPRs.length > 2 ? '\u2026' : ''}
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
                    {useDemo ? 'Yesterday' : new Date(lastSess.date).toLocaleDateString('en', { weekday: 'long' })} {'\u00B7'} {lastSess.durationMin} min
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="gt-mono gt-tnum" style={{ fontSize: 22, fontWeight: 500 }}>
                    {(lastSess.volume / 1000).toFixed(1)}t
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>volume</div>
                </div>
              </div>
              {useDemo ? (
                <>
                  <div className="gt-divider" style={{ margin: '14px -2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(showAllDemo ? lastWorkout.exercises : lastWorkout.exercises.slice(0, 3)).map(e => {
                      const h = HISTORY[e.id];
                      if (!h) return null;
                      const s = h[0];
                      const isPR = lastPRs.some(p => p.ex.id === e.id);
                      return (
                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, fontSize: 14, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                          <div className="gt-mono gt-tnum" style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                            {fmtW(s.w, unit)} {'\u00D7'} {s.r[0]}
                          </div>
                          {isPR && <span className="gt-pill gt-pill-pr" style={{ padding: '2px 6px', fontSize: 10 }}>PR</span>}
                        </div>
                      );
                    })}
                    {!showAllDemo && lastWorkout.exercises.length > 3 && (
                      <div className="gt-tap" style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}
                        onClick={() => setShowAllDemo(true)}>
                        + {lastWorkout.exercises.length - 3} more
                      </div>
                    )}
                    {showAllDemo && lastWorkout.exercises.length > 3 && (
                      <div className="gt-tap" style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}
                        onClick={() => setShowAllDemo(false)}>
                        Show less
                      </div>
                    )}
                  </div>
                </>
              ) : lastRealSets ? (
                <>
                  <div className="gt-divider" style={{ margin: '14px -2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(showAllReal ? lastWorkout.exercises : lastWorkout.exercises.slice(0, 5)).map(e => {
                      const exSets = lastRealSets[e.id];
                      if (!exSets || exSets.length === 0) return null;
                      const topSet = exSets.reduce((a, b) => (a.weightKg || 0) >= (b.weightKg || 0) ? a : b);
                      return (
                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, fontSize: 14, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                          <div className="gt-mono gt-tnum" style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                            {fmtW(topSet.weightKg, unit)} {'\u00D7'} {topSet.reps}
                          </div>
                        </div>
                      );
                    })}
                    {!showAllReal && lastWorkout.exercises.length > 5 && (
                      <div className="gt-tap" style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}
                        onClick={() => setShowAllReal(true)}>
                        + {lastWorkout.exercises.length - 5} more
                      </div>
                    )}
                    {showAllReal && lastWorkout.exercises.length > 5 && (
                      <div className="gt-tap" style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}
                        onClick={() => setShowAllReal(false)}>
                        Show less
                      </div>
                    )}
                  </div>
                </>
              ) : null}
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
            {scheduleDays.map((r, i, arr) => (
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
                {r.state === 'today-rest' && (
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Today</span>
                )}
                {r.state === 'next' && (
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Upcoming</span>
                )}
                {r.state === 'missed' && (
                  <span className="gt-pill" style={{ background: 'transparent', color: 'var(--warn)', fontSize: 11, border: '1px solid var(--warn)' }}>
                    Missed
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

window.Home = Home;

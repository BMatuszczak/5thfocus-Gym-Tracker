// Progress screen — PRs, charts, streak, e1RM trends, suggested progression

function Progress({ unit, useDemo = true }) {
  // If useDemo is off and no real data yet, show empty state
  const realSessions = Store.get().sessions;
  if (!useDemo && realSessions.length < 2) {
    return (
      <div className="gt-scroll">
        <div className="gt-section" style={{ paddingTop: 4, paddingBottom: 16 }}>
          <div className="gt-caption">Your progression</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>
            {realSessions.length === 0 ? "Let's build a baseline." : 'One session in.'}
          </div>
        </div>
        <div className="gt-section">
          <div className="gt-card" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 99, background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
            }}>
              <Icon name="chart" size={28} stroke="var(--text-3)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {realSessions.length === 0 ? 'Log your first session' : 'Need one more session'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, maxWidth: 280, margin: '0 auto' }}>
              {realSessions.length === 0
                ? 'Your PRs, e1RM trends, volume, and consistency heatmap will appear here once you start lifting.'
                : "You've got one session logged. Trends and PRs will start showing after your second."}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Aggregate PRs from history (per exercise: max e1RM ever vs. previous best)
  const exercisePRs = React.useMemo(() => {
    const out = [];
    const allEx = [...WORKOUTS.monday.exercises, ...WORKOUTS.wednesday.exercises];
    allEx.forEach(ex => {
      const sess = HISTORY[ex.id];
      if (!sess || sess.length < 2) return;
      const e1rms = sess.map(s => epley(s.w, Math.max(...s.r)));
      const cur = e1rms[0];
      const prevBest = Math.max(...e1rms.slice(1));
      const isPR = cur > prevBest;
      out.push({
        ex, currentE1RM: cur, previousE1RM: prevBest, isPR,
        delta: cur - prevBest,
        currentTop: sess[0].w,
        previousTop: sess[1] ? sess[1].w : 0,
        trend: e1RMTrend(ex.id),
      });
    });
    return out;
  }, []);

  const newPRs = exercisePRs.filter(p => p.isPR);

  // Volume trend (last 8 sessions)
  const volTrend = SESSIONS.slice(0, 8).slice().reverse().map((s, i) => ({
    label: `W${Math.ceil((SESSIONS.slice(0, 8).length - i) / 2)}`,
    volume: s.volume,
    date: s.date,
  }));

  // Compress to 6 weekly buckets
  const weekly = (() => {
    const buckets = [];
    for (let w = 5; w >= 0; w--) {
      const weekSessions = SESSIONS.filter((_s, idx) => {
        const days = parseInt(_s.date.split('-').reduce((a, b) => a - b, 0)); // not used
        return false;
      });
      // simpler — pair sessions by week
    }
    // Just take 6 most recent sessions, label as W6..W1
    const recent = SESSIONS.slice(0, 6).slice().reverse();
    return recent.map((s, i) => ({
      label: `W${i + 1}`, volume: s.volume,
    }));
  })();

  return (
    <div className="gt-scroll">
      {/* Header */}
      <div className="gt-section" style={{ paddingTop: 4, paddingBottom: 16 }}>
        <div className="gt-caption">Your progression</div>
        <div style={{ fontSize: 32, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>
          Getting stronger.
        </div>
      </div>

      {/* Headline stat: total strength gained */}
      <div className="gt-section" style={{ marginBottom: 14 }}>
        <div className="gt-hero" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1 }}>
              <div className="gt-caption" style={{ marginBottom: 8 }}>Last 6 weeks</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="gt-mono gt-tnum" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  +{Math.round(toUnit(exercisePRs.reduce((a, p) => a + Math.max(0, p.currentE1RM - (p.trend[0]?.e1RM || 0)), 0), unit))}
                </span>
                <span style={{ fontSize: 18, color: 'var(--text-3)' }}>{unit}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                Total estimated 1RM gained across {exercisePRs.length} lifts
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <MiniChart
                data={(() => {
                  // average e1RM trend across all lifts, normalized
                  const all = exercisePRs.map(p => p.trend).filter(t => t.length > 1);
                  if (!all.length) return [];
                  const maxLen = Math.max(...all.map(t => t.length));
                  const points = [];
                  for (let i = 0; i < maxLen; i++) {
                    const vals = all.map(t => t[i]?.e1RM).filter(Boolean);
                    if (vals.length) points.push({ e1RM: vals.reduce((a, b) => a + b, 0) / vals.length });
                  }
                  return points;
                })()}
                w={120} h={56}
              />
            </div>
          </div>
        </div>
      </div>

      {/* New PRs this month */}
      {newPRs.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="gt-section" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="gt-caption" style={{ whiteSpace: 'nowrap' }}>New PRs</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{newPRs.length} this month</div>
          </div>
          <div style={{
            display: 'flex', gap: 10, padding: '0 20px',
            overflowX: 'auto', scrollSnapType: 'x mandatory',
          }} className="gt-scroll-x">
            {newPRs.map(p => (
              <div key={p.ex.id} style={{
                flexShrink: 0, width: 180,
                scrollSnapAlign: 'start',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18, padding: 14,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 100, height: 100,
                  background: 'radial-gradient(circle, var(--warn-soft) 0%, transparent 70%)',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Icon name="trophy" size={14} stroke="var(--warn)" />
                    <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PR</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.2, height: 34, overflow: 'hidden' }}>
                    {p.ex.name}
                  </div>
                  <div className="gt-mono gt-tnum" style={{ fontSize: 22, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {fmtW(p.currentTop, unit)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--good)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
                    <Icon name="arrowUp" size={10} stroke="var(--good)" />
                    +{toUnit(p.currentTop - p.previousTop, unit)} {unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-exercise trend cards */}
      <div className="gt-section" style={{ marginBottom: 18 }}>
        <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>Estimated 1RM · per lift</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exercisePRs.filter(p => p.trend.length > 1).map(p => {
            const start = p.trend[0].e1RM;
            const cur = p.trend[p.trend.length - 1].e1RM;
            const gain = Math.round((cur - start) * 10) / 10;
            const pct = start > 0 ? Math.round((gain / start) * 100) : 0;
            return (
              <div key={p.ex.id} className="gt-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ex.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4, whiteSpace: 'nowrap' }}>
                    <span className="gt-mono gt-tnum" style={{ fontSize: 20, fontWeight: 500 }}>
                      {toUnit(Math.round(cur * 10) / 10, unit)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{unit} e1RM</span>
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: gain > 0 ? 'var(--good)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {gain > 0 ? '+' : ''}{toUnit(gain, unit)} {unit} · {pct > 0 ? '+' : ''}{pct}%
                  </div>
                </div>
                <MiniChart data={p.trend} w={100} h={44} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Consistency */}
      <div className="gt-section" style={{ marginBottom: 18 }}>
        <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>Consistency · last 6 weeks</div>
        <div className="gt-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="gt-mono gt-tnum" style={{ fontSize: 28, fontWeight: 500 }}>{STREAK.sessionsLast30}</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>sessions / 30d</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Longest streak {STREAK.longest} sessions
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="flame" size={20} stroke="var(--accent)" />
              <div>
                <div className="gt-mono gt-tnum" style={{ fontSize: 20, fontWeight: 500 }}>{STREAK.current}</div>
                <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>week streak</div>
              </div>
            </div>
          </div>
          <StreakHeatmap sessions={SESSIONS} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 10, color: 'var(--text-3)' }}>
            <span>6 weeks ago</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>less</span>
              {[0, 1, 2, 3].map(l => (
                <div key={l} className="gt-cell" data-level={l} style={{ width: 10, height: 10 }} />
              ))}
              <span>more</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Weekly volume */}
      <div className="gt-section" style={{ marginBottom: 18 }}>
        <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>Volume per session</div>
        <div className="gt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <span className="gt-mono gt-tnum" style={{ fontSize: 24, fontWeight: 500 }}>
                {(SESSIONS[0].volume / 1000).toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 4 }}>t · last session</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--good)' }}>
              +{Math.round(((SESSIONS[0].volume - SESSIONS[2].volume) / SESSIONS[2].volume) * 100)}% vs 2 sessions ago
            </div>
          </div>
          <BarChart data={weekly} w={320} h={100} valueKey="volume" labelKey="label" />
        </div>
      </div>

      {/* Suggested progression for next session */}
      <div className="gt-section" style={{ marginBottom: 14 }}>
        <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>Coach · suggestions for Wednesday</div>
        <div className="gt-card" style={{ padding: 0, overflow: 'hidden' }}>
          {WORKOUTS.wednesday.exercises.filter(e => HISTORY[e.id]).slice(0, 4).map((e, i, arr) => {
            const h = HISTORY[e.id];
            const last = h[0];
            const lastRIRs = last.rir;
            const minRIR = Math.min(...lastRIRs);
            const allReps = last.r.every(r => r >= (e.reps || 0));
            const cleanLastTime = minRIR >= 1 && allReps;
            const suggest = cleanLastTime
              ? { delta: e.bodyweight ? +1 : (e.id === 'hip-thrust' ? 5 : 2.5), reason: 'clean last time' }
              : { delta: 0, reason: 'repeat to consolidate' };
            return (
              <div key={e.id} style={{
                padding: '13px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {suggest.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="gt-mono gt-tnum" style={{ fontSize: 14, color: 'var(--text)' }}>
                    {e.bodyweight ? `${last.r[0]}` : fmtW(last.w + suggest.delta, unit)}
                  </div>
                  {suggest.delta !== 0 && (
                    <div style={{ fontSize: 10, color: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 1 }}>
                      <Icon name="arrowUp" size={9} stroke="var(--good)" />
                      +{toUnit(suggest.delta, unit)} {unit}
                    </div>
                  )}
                  {suggest.delta === 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>same</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, paddingLeft: 4, lineHeight: 1.5 }}>
          Bump when last set finished with 1+ reps in reserve. Repeat the weight when any set broke down.
        </div>
      </div>
    </div>
  );
}

window.Progress = Progress;

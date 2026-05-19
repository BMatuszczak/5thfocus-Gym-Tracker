// Shared components for Gym Tracker

// ─────────────────────────────────────────────────────────────
// Icons (24×24 stroke icons)
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, stroke = 'currentColor', strokeWidth = 1.8 }) => {
  const p = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    flame: <path d="M12 3c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-2-4 0 2-1 3-2 3 0-3 0-5 0-8z" {...p} />,
    bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" {...p} />,
    trophy: <g {...p}><path d="M7 4h10v3a5 5 0 01-10 0V4z"/><path d="M7 6H4v2a3 3 0 003 3"/><path d="M17 6h3v2a3 3 0 01-3 3"/><path d="M9 20h6M12 16v4M9 16h6"/></g>,
    play: <path d="M7 4l13 8-13 8V4z" fill={stroke} stroke="none" />,
    check: <path d="M5 12l4 4L19 6" {...p} strokeWidth="2.2" />,
    x: <path d="M5 5l14 14M19 5L5 19" {...p} />,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevD: <path d="M5 9l7 7 7-7" {...p} />,
    chevU: <path d="M5 15l7-7 7 7" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    minus: <path d="M5 12h14" {...p} />,
    home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" {...p} />,
    chart: <g {...p}><path d="M4 20V4"/><path d="M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/></g>,
    settings: <g {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5.1 5.8l-2 3.5 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z"/></g>,
    info: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.1"/></g>,
    skip: <g {...p}><path d="M5 4l10 8-10 8V4z" fill={stroke} stroke="none"/><path d="M19 4v16" /></g>,
    pause: <g {...p}><rect x="6" y="5" width="4" height="14" rx="1" fill={stroke} stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill={stroke} stroke="none"/></g>,
    swap: <g {...p}><path d="M7 7h13l-3-3M17 17H4l3 3"/></g>,
    arrowUp: <path d="M12 19V5M5 12l7-7 7 7" {...p} />,
    dot: <circle cx="12" cy="12" r="3" fill={stroke} stroke="none" />,
    calendar: <g {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></g>,
    clock: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
    dumbbell: <g {...p}><path d="M4 9v6M7 6v12M17 6v12M20 9v6"/><path d="M7 12h10"/></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
};

// ─────────────────────────────────────────────────────────────
// Number stepper
// ─────────────────────────────────────────────────────────────
function Stepper({ value, onChange, step = 2.5, min = 0, unit = '' }) {
  return (
    <div className="gt-step">
      <button className="gt-step-btn" onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}>
        <Icon name="minus" size={18} />
      </button>
      <div className="gt-step-val gt-tnum">
        {value}{unit && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>{unit}</span>}
      </div>
      <button className="gt-step-btn" onClick={() => onChange(Math.round((value + step) * 10) / 10)}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Unit conversion
// ─────────────────────────────────────────────────────────────
const fmtW = (kg, unit) => {
  if (kg === 0) return 'BW';
  if (unit === 'lb') return `${Math.round(kg * 2.2046 * 2) / 2} lb`;
  return `${kg} kg`;
};
const toUnit = (kg, unit) => unit === 'lb' ? Math.round(kg * 2.2046 * 2) / 2 : kg;
const fromUnit = (v, unit) => unit === 'lb' ? Math.round(v / 2.2046 * 2) / 2 : v;

// ─────────────────────────────────────────────────────────────
// Mini line chart (SVG)
// ─────────────────────────────────────────────────────────────
function MiniChart({ data, w = 240, h = 56, dot = true, valueKey = 'e1RM' }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const vals = data.map(d => d[valueKey]);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const pad = 6;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = vals.map(v => h - pad - ((v - min) / range) * (h - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const areaPath = `${path} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={areaPath} className="gt-chart-area" />
      <path d={path} className="gt-chart-line" />
      {dot && (
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Bar chart
// ─────────────────────────────────────────────────────────────
function BarChart({ data, w = 320, h = 110, valueKey = 'volume', labelKey = 'label' }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d[valueKey]));
  const barW = (w - (data.length - 1) * 6) / data.length;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d[valueKey] / max) * (h - 24));
        const x = i * (barW + 6);
        const y = h - 24 - bh;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="3"
              fill={isLast ? 'var(--accent)' : 'var(--surface-3)'} />
            <text x={x + barW / 2} y={h - 8}
              fill="var(--text-3)" fontSize="10" fontFamily="var(--f-mono)"
              textAnchor="middle">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress ring
// ─────────────────────────────────────────────────────────────
function ProgressRing({ value, max = 1, size = 64, stroke = 6, color = 'var(--accent)', track = 'var(--surface-3)' }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C - (value / max) * C;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────────────────────
function TabBar({ value, onChange }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: 'home' },
    { id: 'progress', label: 'Progress', icon: 'chart' },
  ];
  return (
    <div className="gt-tabs">
      {tabs.map(t => (
        <button key={t.id} className="gt-tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          <Icon name={t.icon} size={22} stroke={value === t.id ? 'var(--text)' : 'var(--text-3)'} />
          <div>{t.label}</div>
          <div className="gt-tab-dot" />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Streak heatmap (last 6 weeks, 42 days)
// ─────────────────────────────────────────────────────────────
function StreakHeatmap({ sessions }) {
  // build a map of date -> level
  const map = {};
  sessions.forEach(s => { map[s.date] = s.durationMin > 50 ? 3 : 2; });
  const cells = [];
  const today = new Date('2026-05-19');
  // 42 cells, today bottom-right; iterate 41..0 days ago
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, level: map[key] || 0, label: d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' }) });
  }
  // arrange in 6 columns x 7 rows
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
      {cells.map(c => (
        <div key={c.key} className="gt-cell" data-level={c.level} title={c.label} />
      ))}
    </div>
  );
}

Object.assign(window, {
  Icon, Stepper, MiniChart, BarChart, ProgressRing, TabBar, StreakHeatmap,
  fmtW, toUnit, fromUnit,
});

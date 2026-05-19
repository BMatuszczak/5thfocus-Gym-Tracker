// Settings screen — replaces the Tweaks panel for users on deployed app.
// Slides up as a modal sheet from anywhere.

function Settings({ tweaks, setTweak, onClose, onJumpWorkout, onReset }) {
  const accents = window.ACCENT_OPTIONS;
  const data = Store.get();
  const realSessionCount = data.sessions.length;
  const hasActive = !!data.active;

  const exportData = () => {
    const json = Store.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (Store.import(reader.result)) {
          alert('Backup restored. Reloading.');
          location.reload();
        } else {
          alert('Could not read that backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetData = () => {
    if (confirm('Wipe ALL logged sessions and active workout? This cannot be undone.')) {
      Store.reset();
      location.reload();
    }
  };

  return (
    <div className="gt-app" style={{ background: 'var(--bg)' }}>
      <div className="gt-scroll">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '4px 16px 18px',
        }}>
          <button className="gt-btn gt-btn-ghost" style={{ padding: 10, borderRadius: 12 }} onClick={onClose}>
            <Icon name="x" size={18} stroke="var(--text-2)" />
          </button>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</div>
        </div>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsRow label="Accent color">
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(accents).map(([hex, info]) => (
                <button key={hex}
                  onClick={() => setTweak('accent', hex)}
                  style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: hex, border: 'none',
                    boxShadow: tweaks.accent === hex
                      ? `0 0 0 2px var(--bg), 0 0 0 4px ${hex}`
                      : 'none',
                    cursor: 'pointer',
                  }} aria-label={info.name} />
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="Theme">
            <Segmented value={tweaks.theme} options={[
              { v: 'dark', l: 'Dark' },
              { v: 'light', l: 'Light' },
            ]} onChange={(v) => setTweak('theme', v)} />
          </SettingsRow>
        </SettingsSection>

        {/* Units */}
        <SettingsSection title="Units">
          <SettingsRow label="Weight">
            <Segmented value={tweaks.unit} options={[
              { v: 'kg', l: 'kg' },
              { v: 'lb', l: 'lb' },
            ]} onChange={(v) => setTweak('unit', v)} />
          </SettingsRow>
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Your data">
          <SettingsRow label="Demo data" subtitle="Turn off to start fresh from your first real session">
            <Segmented value={tweaks.useDemo ? 'on' : 'off'} options={[
              { v: 'on', l: 'On' },
              { v: 'off', l: 'Off' },
            ]} onChange={(v) => setTweak('useDemo', v === 'on')} />
          </SettingsRow>
          <SettingsRow label="Sessions logged">
            <span className="gt-mono gt-tnum" style={{ color: 'var(--text-2)' }}>{realSessionCount}</span>
          </SettingsRow>
          {hasActive && (
            <SettingsRow label="Active workout" subtitle="An in-progress workout is saved">
              <span className="gt-pill gt-pill-accent" style={{ fontSize: 11 }}>resumable</span>
            </SettingsRow>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button className="gt-btn" style={{ justifyContent: 'space-between', width: '100%' }} onClick={exportData}>
              <span>Export backup</span>
              <Icon name="arrowUp" size={14} stroke="var(--text-2)" />
            </button>
            <button className="gt-btn" style={{ justifyContent: 'space-between', width: '100%' }} onClick={importData}>
              <span>Import backup</span>
              <Icon name="plus" size={14} stroke="var(--text-2)" />
            </button>
            <button className="gt-btn" style={{
              justifyContent: 'space-between', width: '100%',
              background: 'transparent',
              color: 'var(--danger)',
              border: '1px solid var(--border)',
            }} onClick={resetData}>
              <span>Reset all data</span>
              <Icon name="x" size={14} stroke="var(--danger)" />
            </button>
          </div>
        </SettingsSection>

        {/* Quick jumps */}
        <SettingsSection title="Quick start">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="gt-btn gt-btn-primary" style={{ justifyContent: 'space-between', width: '100%' }}
              onClick={() => onJumpWorkout('wednesday')}>
              <span>Start Wednesday · Full Body</span>
              <Icon name="play" size={14} stroke="var(--accent-text)" />
            </button>
            <button className="gt-btn" style={{ justifyContent: 'space-between', width: '100%' }}
              onClick={() => onJumpWorkout('monday')}>
              <span>Start Monday · Lower Body</span>
              <Icon name="play" size={14} stroke="var(--text-2)" />
            </button>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55, padding: '0 4px' }}>
            Lift v0.1 · Your data is stored on this device only.
            Export regularly if you care about it.
          </div>
        </SettingsSection>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="gt-section" style={{ marginBottom: 22 }}>
      <div className="gt-caption" style={{ marginBottom: 10, paddingLeft: 4 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, subtitle, children }) {
  return (
    <div className="gt-card" style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 14, marginBottom: 8,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 0,
    }}>
      {options.map(o => (
        <button key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            appearance: 'none', border: 'none', background: value === o.v ? 'var(--surface-3)' : 'transparent',
            color: value === o.v ? 'var(--text)' : 'var(--text-3)',
            padding: '7px 14px', borderRadius: 7, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'background 0.15s',
          }}>{o.l}</button>
      ))}
    </div>
  );
}

window.Settings = Settings;

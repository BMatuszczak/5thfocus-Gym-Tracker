// Root app — navigation state, tweaks integration

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C8F542",
  "theme": "dark",
  "unit": "kg",
  "demoDay": "rest",
  "useDemo": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = {
  '#C8F542': { name: 'Lime',    deep: '#9BC332', text: '#0A0A0B' },  // default electric lime
  '#FF6A3D': { name: 'Coral',   deep: '#D24F26', text: '#0A0A0B' },  // warm energy
  '#4DA3FF': { name: 'Cobalt',  deep: '#2680E0', text: '#0A0A0B' },  // calm/cool
  '#E8E8E0': { name: 'Bone',    deep: '#B8B8B0', text: '#0A0A0B' },  // monochrome
};
window.ACCENT_OPTIONS = ACCENT_OPTIONS;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState('today');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  // If there's an in-progress workout, resume into it on launch
  const initialRoute = React.useMemo(() => {
    const a = Store.get().active;
    return a ? { name: 'workout', id: a.workoutId } : { name: 'home' };
  }, []);
  const [route, setRoute] = React.useState(initialRoute);

  // apply accent dynamically
  React.useEffect(() => {
    const root = document.documentElement;
    const a = ACCENT_OPTIONS[t.accent] || ACCENT_OPTIONS['#C8F542'];
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-deep', a.deep);
    root.style.setProperty('--accent-text', a.text);
    // accent-soft: 14% alpha via color-mix fallback
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${t.accent} 14%, transparent)`);
    root.dataset.theme = t.theme;
  }, [t.accent, t.theme]);

  const startWorkout = () => {
    // Wednesday is the upcoming session in the demo
    setRoute({ name: 'workout', id: 'wednesday' });
  };

  return (
    <div className="gt-app" data-theme={t.theme}>
      {settingsOpen && (
        <Settings tweaks={t} setTweak={setTweak}
          onClose={() => setSettingsOpen(false)}
          onJumpWorkout={(id) => { setSettingsOpen(false); setRoute({ name: 'workout', id }); }} />
      )}
      {!settingsOpen && route.name === 'home' && (
        <>
          {tab === 'today' && <Home unit={t.unit} useDemo={t.useDemo} onStart={startWorkout} demoDay={t.demoDay} onOpenSettings={() => setSettingsOpen(true)} />}
          {tab === 'progress' && <Progress unit={t.unit} useDemo={t.useDemo} />}
          <TabBar value={tab} onChange={setTab} />
        </>
      )}

      {!settingsOpen && route.name === 'workout' && (
        <Workout
          workoutId={route.id}
          unit={t.unit}
          onExit={() => setRoute({ name: 'home' })}
          onComplete={() => { setRoute({ name: 'home' }); setTab('progress'); }}
        />
      )}

      <TweaksPanel>
        <TweakSection label="Look" />
        <TweakColor label="Accent" value={t.accent}
          options={Object.keys(ACCENT_OPTIONS)}
          onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Theme" value={t.theme}
          options={['dark', 'light']}
          onChange={(v) => setTweak('theme', v)} />

        <TweakSection label="Units" />
        <TweakRadio label="Weight" value={t.unit}
          options={['kg', 'lb']}
          onChange={(v) => setTweak('unit', v)} />

        <TweakSection label="Demo" />
        <TweakRadio label="Today" value={t.demoDay}
          options={['rest', 'workout']}
          onChange={(v) => setTweak('demoDay', v)} />
        <TweakButton label="Jump to Wednesday"
          onClick={() => setRoute({ name: 'workout', id: 'wednesday' })} />
        <TweakButton label="Jump to Monday"
          onClick={() => setRoute({ name: 'workout', id: 'monday' })} />
        <TweakButton label="Back to home"
          onClick={() => setRoute({ name: 'home' })} />

        <TweakSection label="Your data" />
        <TweakButton label="Export backup (JSON)"
          onClick={() => {
            const json = Store.export();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gym-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} />
        <TweakButton label="Import backup"
          onClick={() => {
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
          }} />
        <TweakButton label="Reset all data"
          onClick={() => {
            if (confirm('Wipe all logged sessions and active workout? This cannot be undone.')) {
              Store.reset();
              location.reload();
            }
          }} />
      </TweaksPanel>
    </div>
  );
}

window.App = App;

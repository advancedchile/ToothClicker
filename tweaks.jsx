// Tooth Clicker — Tweaks Panel
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "darkMode": false,
  "accent": "azul",
  "density": "normal"
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  azul: {
    i005: '#F6FBFF', i010: '#EBF4FC', i020: '#CCE4F8', i030: '#B2D6F4',
    i040: '#99C8F1', i050: '#80BAED', i060: '#66ADE9', i070: '#4D9FE6',
    i080: '#3391E2', i090: '#1A84DF', i100: '#0076DB', i130: '#0062B8', i150: '#005199',
  },
  dorado: {
    i005: '#FFFDF5', i010: '#FFF9E6', i020: '#FFF0BF', i030: '#FFE799',
    i040: '#FFDE72', i050: '#FFD44C', i060: '#FFCA26', i070: '#F5BC00',
    i080: '#D9A700', i090: '#BD9200', i100: '#A17D00', i130: '#7A5F00', i150: '#544100',
  },
  coral: {
    i005: '#FFF5F3', i010: '#FFE9E5', i020: '#FFD0C8', i030: '#FFB7AB',
    i040: '#FF9E8F', i050: '#FF8572', i060: '#FF6C55', i070: '#F55338',
    i080: '#E03A1E', i090: '#C42204', i100: '#A81A00', i130: '#841500', i150: '#601000',
  },
  menta: {
    i005: '#F2FBF6', i010: '#E3F6EC', i020: '#C2EBCF', i030: '#A0E0B3',
    i040: '#7FD497', i050: '#5EC97A', i060: '#3DBD5E', i070: '#1EB245',
    i080: '#0A9E33', i090: '#008A22', i100: '#007611', i130: '#005B0D', i150: '#004009',
  },
};

const DENSITY_SCALES = {
  compacto: 0.75,
  normal:   1,
  espacioso: 1.35,
};

const SPACING_TOKENS = [
  ['--spacing-0-5','0.125rem'], ['--spacing-1','0.25rem'], ['--spacing-1-5','0.375rem'],
  ['--spacing-2','0.5rem'],    ['--spacing-2-5','0.625rem'], ['--spacing-3','0.75rem'],
  ['--spacing-3-5','0.875rem'], ['--spacing-4','1rem'],      ['--spacing-4-5','1.125rem'],
  ['--spacing-5','1.25rem'],   ['--spacing-5-5','1.375rem'], ['--spacing-6','1.5rem'],
  ['--spacing-7','1.75rem'],   ['--spacing-7-5','1.875rem'], ['--spacing-8','2rem'],
  ['--spacing-9-5','2.375rem'],['--spacing-10','2.5rem'],    ['--spacing-10-5','2.625rem'],
  ['--spacing-12','3rem'],     ['--spacing-12-5','3.125rem'],['--spacing-14','3.5rem'],
  ['--spacing-16','4rem'],     ['--spacing-20','5rem'],       ['--spacing-24','6rem'],
];

function parsePxRem(v) {
  const m = v.match(/([\d.]+)rem/);
  return m ? parseFloat(m[1]) : null;
}

function applyTweaks({ darkMode, accent, density }) {
  const root = document.documentElement;

  // --- Dark mode ---
  if (darkMode) {
    root.style.setProperty('--bg-1',      '#0F1318');
    root.style.setProperty('--bg-2',      '#161C22');
    root.style.setProperty('--bg-3',      '#1E262F');
    root.style.setProperty('--bg-canvas', '#0A0E12');
    root.style.setProperty('--fg-1',      '#F0F4F8');
    root.style.setProperty('--fg-2',      '#A8B8C8');
    root.style.setProperty('--fg-3',      '#6A7E90');
    root.style.setProperty('--fg-4',      '#445566');
    root.style.setProperty('--border-subtle',  '#1E2A35');
    root.style.setProperty('--border-default', '#263545');
    root.style.setProperty('--border-strong',  '#3A5060');
    root.style.setProperty('--bg-accent-soft', '#0076DB22');
  } else {
    ['--bg-1','--bg-2','--bg-3','--bg-canvas','--fg-1','--fg-2','--fg-3','--fg-4',
     '--border-subtle','--border-default','--border-strong','--bg-accent-soft'].forEach(v => root.style.removeProperty(v));
  }

  // --- Accent palette ---
  const pal = ACCENT_PALETTES[accent] || ACCENT_PALETTES.azul;
  Object.entries(pal).forEach(([key, val]) => {
    root.style.setProperty(`--primary-${key}`, val);
  });
  root.style.setProperty('--fg-accent', pal.i100);
  root.style.setProperty('--border-focus', pal.i100);

  // --- Density ---
  const scale = DENSITY_SCALES[density] || 1;
  SPACING_TOKENS.forEach(([token, base]) => {
    const val = parsePxRem(base);
    if (val !== null) root.style.setProperty(token, `${(val * scale).toFixed(4)}rem`);
  });
}

function ToothTweaksPanel() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => { applyTweaks(tweaks); }, [tweaks.darkMode, tweaks.accent, tweaks.density]);

  const accentOptions = [
    { value: 'azul',    label: '🔵 Azul' },
    { value: 'dorado',  label: '🟡 Dorado' },
    { value: 'coral',   label: '🔴 Coral' },
    { value: 'menta',   label: '🟢 Menta' },
  ];

  const densityOptions = [
    { value: 'compacto',  label: 'Compacto' },
    { value: 'normal',    label: 'Normal' },
    { value: 'espacioso', label: 'Espacioso' },
  ];

  return (
    <TweaksPanel>
      <TweakSection label="Apariencia">
        <TweakToggle
          label="Modo oscuro"
          value={tweaks.darkMode}
          onChange={v => setTweak('darkMode', v)}
        />
      </TweakSection>
      <TweakSection label="Color de acento">
        <TweakRadio
          options={accentOptions}
          value={tweaks.accent}
          onChange={v => setTweak('accent', v)}
        />
      </TweakSection>
      <TweakSection label="Densidad">
        <TweakRadio
          options={densityOptions}
          value={tweaks.density}
          onChange={v => setTweak('density', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const tweaksRoot = document.createElement('div');
document.body.appendChild(tweaksRoot);
ReactDOM.createRoot(tweaksRoot).render(<ToothTweaksPanel />);

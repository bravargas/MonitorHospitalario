(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  const CHANNEL2_TYPES = ['cvp', 'art2', 'pap', 'icp', 'off'];
  const CONTROL_CONFIG = [
    { key: 'hr', label: 'Frecuencia cardíaca', min: 20, max: 220, step: 1, unit: 'bpm' },
    { key: 'resp', label: 'Frecuencia respiratoria', min: 4, max: 45, step: 1, unit: 'rpm' },
    { key: 'spo2', label: 'SpO2', min: 50, max: 100, step: 1, unit: '%' },
    { key: 'co2', label: 'ETCO2', min: 0, max: 80, step: 1, unit: 'mmHg' },
    { key: 'sys', label: 'Presión sistólica', min: 50, max: 240, step: 1, unit: 'mmHg' },
    { key: 'dia', label: 'Presión diastólica', min: 20, max: 140, step: 1, unit: 'mmHg' },
    { key: 'cvp', label: 'Valor canal 2', min: 0, max: 30, step: 1, unit: 'mmHg' },
    { key: 'temp', label: 'Temperatura', min: 30, max: 42, step: 0.1, unit: '°C' }
  ];

  const PROFILES = {
    normal: { hr: 80, resp: 14, spo2: 99, co2: 38, sys: 120, dia: 80, temp: 37.0, cvp: 10 },
    tachy: { hr: 135, resp: 24, spo2: 97, co2: 35, sys: 110, dia: 70, temp: 37.4, cvp: 8 },
    brady: { hr: 42, resp: 10, spo2: 98, co2: 40, sys: 100, dia: 60, temp: 36.5, cvp: 9 },
    hypoxia: { hr: 118, resp: 30, spo2: 82, co2: 32, sys: 126, dia: 76, temp: 37.2, cvp: 10 },
    shock: { hr: 145, resp: 32, spo2: 89, co2: 28, sys: 78, dia: 48, temp: 36.1, cvp: 4 },
    sedation: { hr: 58, resp: 8, spo2: 95, co2: 47, sys: 108, dia: 68, temp: 36.7, cvp: 11 }
  };

  const DEFAULT_STATE = {
    alarmsEnabled: true,
    soundEnabled: true,
    alarmVolume: 0.5,
    ecgLeadsOff: false,
    spo2ProbeOff: false,
    tempProbeOff: false,
    activeAlarms: [],
    lastAlarmBeep: 0,
    lastHeartBeatAt: 0,
    audioUnlocked: false,
    running: true,
    showGrid: true,
    showDiagnostic: true,
    channel2Type: 'cvp',
    hr: 80,
    resp: 14,
    spo2: 99,
    co2: 38,
    sys: 120,
    dia: 80,
    temp: 37.0,
    cvp: 10,
    time: 0
  };

  const listeners = new Set();
  const state = clone(DEFAULT_STATE);
  const numericKeys = new Map(CONTROL_CONFIG.map(cfg => [cfg.key, cfg]));

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundByStep(value, step) {
    if (!Number.isFinite(step) || step >= 1) {
      return Math.round(value);
    }
    const digits = String(step).split('.')[1]?.length || 0;
    return Number(value.toFixed(digits));
  }

  function sanitizePatch(input) {
    const patch = {};
    if (!input || typeof input !== 'object') {
      return patch;
    }

    numericKeys.forEach((cfg, key) => {
      if (!(key in input)) {
        return;
      }
      const raw = Number(input[key]);
      if (!Number.isFinite(raw)) {
        return;
      }
      patch[key] = roundByStep(clamp(raw, cfg.min, cfg.max), cfg.step);
    });

    ['alarmsEnabled', 'soundEnabled', 'running', 'showGrid', 'showDiagnostic', 'ecgLeadsOff', 'spo2ProbeOff', 'tempProbeOff'].forEach(key => {
      if (key in input) {
        patch[key] = Boolean(input[key]);
      }
    });

    if ('alarmVolume' in input) {
      const raw = Number(input.alarmVolume);
      if (Number.isFinite(raw)) {
        patch.alarmVolume = clamp(raw, 0, 1);
      }
    }

    if ('channel2Type' in input) {
      patch.channel2Type = CHANNEL2_TYPES.includes(input.channel2Type) ? input.channel2Type : DEFAULT_STATE.channel2Type;
    }

    return patch;
  }

  function emit(meta = {}) {
    listeners.forEach(listener => listener(state, meta));
  }

  function setState(patch, meta = { source: 'local' }) {
    const sanitized = sanitizePatch(patch);
    let changed = false;

    Object.entries(sanitized).forEach(([key, value]) => {
      if (state[key] !== value) {
        state[key] = value;
        changed = true;
      }
    });

    if (changed) {
      emit(meta);
    }

    return changed;
  }

  function replaceState(nextState, meta = { source: 'remote' }) {
    return setState(nextState, meta);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState() {
    return state;
  }

  function getSerializableState() {
    return {
      alarmsEnabled: state.alarmsEnabled,
      soundEnabled: state.soundEnabled,
      alarmVolume: state.alarmVolume,
      ecgLeadsOff: state.ecgLeadsOff,
      spo2ProbeOff: state.spo2ProbeOff,
      tempProbeOff: state.tempProbeOff,
      running: state.running,
      showGrid: state.showGrid,
      showDiagnostic: state.showDiagnostic,
      channel2Type: state.channel2Type,
      hr: state.hr,
      resp: state.resp,
      spo2: state.spo2,
      co2: state.co2,
      sys: state.sys,
      dia: state.dia,
      temp: state.temp,
      cvp: state.cvp
    };
  }

  function applyProfile(name, meta = { source: 'local' }) {
    if (!PROFILES[name]) {
      return false;
    }
    return setState(PROFILES[name], meta);
  }

  function mapPressureValue(currentState = state) {
    return Math.round((currentState.sys + 2 * currentState.dia) / 3);
  }

  function getChannel2Display(currentState = state) {
    if (currentState.channel2Type === 'off') {
      return { label: 'CH2:Off', line1: '---/---', line2: '(---)', unit: '' };
    }

    if (currentState.channel2Type === 'cvp') {
      return { label: 'CH2:Cvp', line1: 'CVP', line2: String(currentState.cvp), unit: 'mmHg' };
    }

    if (currentState.channel2Type === 'art2') {
      const sys2 = clamp(currentState.sys - 6, 30, 260);
      const dia2 = clamp(currentState.dia - 4, 10, 180);
      const map2 = Math.round((sys2 + 2 * dia2) / 3);
      return { label: 'CH2:Art2', line1: `${sys2}/${dia2}`, line2: `(${map2})`, unit: 'mmHg' };
    }

    if (currentState.channel2Type === 'pap') {
      const sysP = clamp(Math.round(currentState.sys * 0.28), 10, 80);
      const diaP = clamp(Math.round(currentState.dia * 0.22), 4, 40);
      const meanP = Math.round((sysP + 2 * diaP) / 3);
      return { label: 'CH2:PAP', line1: `${sysP}/${diaP}`, line2: `(${meanP})`, unit: 'mmHg' };
    }

    if (currentState.channel2Type === 'icp') {
      return {
        label: 'CH2:ICP',
        line1: 'ICP',
        line2: String(clamp(Math.round(currentState.cvp + 2), 0, 40)),
        unit: 'mmHg'
      };
    }

    return { label: 'CH2:Cvp', line1: 'CVP', line2: String(currentState.cvp), unit: 'mmHg' };
  }

  App.state = {
    CHANNEL2_TYPES,
    CONTROL_CONFIG,
    DEFAULT_STATE,
    PROFILES,
    applyProfile,
    clamp,
    getChannel2Display,
    getSerializableState,
    getState,
    mapPressureValue,
    replaceState,
    sanitizePatch,
    setState,
    state,
    subscribe
  };
})();

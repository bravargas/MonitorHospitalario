(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  const CHANNEL2_TYPES = ['cvp', 'art2', 'pap', 'icp', 'off'];
  const PATIENT_CATEGORIES = ['adult', 'pediatric', 'neonate'];
  const ECG_GAINS = [0.5, 1, 2];
  const ECG_SWEEP_SPEEDS = [12.5, 25, 50];
  const CONTROL_CONFIG = [
    { key: 'hr', label: 'Heart rate', min: 20, max: 220, step: 1, unit: 'bpm' },
    { key: 'resp', label: 'Respiratory rate', min: 4, max: 45, step: 1, unit: 'rpm' },
    { key: 'spo2', label: 'SpO2', min: 50, max: 100, step: 1, unit: '%' },
    { key: 'co2', label: 'ETCO2', min: 0, max: 80, step: 1, unit: 'mmHg' },
    { key: 'sys', label: 'Systolic pressure', min: 50, max: 240, step: 1, unit: 'mmHg' },
    { key: 'dia', label: 'Diastolic pressure', min: 20, max: 140, step: 1, unit: 'mmHg' },
    { key: 'cvp', label: 'Channel 2 value', min: 0, max: 30, step: 1, unit: 'mmHg' },
    { key: 'temp', label: 'Temperature', min: 30, max: 42, step: 0.1, unit: '°C' }
  ];

  const PATIENT_CATEGORY_CONFIGS = {
    adult: {
      label: 'Adult',
      headerLabel: 'ADULT',
      defaults: { hr: 80, resp: 14, spo2: 99, co2: 38, sys: 120, dia: 80, temp: 37.0, cvp: 10, stProfile: 'normal', ecgGain: 1, ecgSweepSpeed: 25 },
      limits: { hrLow: 45, hrHigh: 130, respLow: 8, respHigh: 28, spo2Low: 90, spo2Critical: 85, sysLow: 90, co2High: 50, co2Low: 25, co2LowRespGate: 20, tempHigh: 39.0, cvpHigh: 15, icpHigh: 20 },
      controlRanges: {
        hr: { min: 20, max: 220 },
        resp: { min: 4, max: 45 },
        spo2: { min: 50, max: 100 },
        co2: { min: 0, max: 80 },
        sys: { min: 50, max: 240 },
        dia: { min: 20, max: 140 },
        cvp: { min: 0, max: 30 },
        temp: { min: 30, max: 42 }
      },
      waveProfile: { ecgScale: 1, ecgWidthScale: 1, plethScale: 1, plethWidthScale: 1, respScale: 1, respWidthScale: 1, co2Scale: 1, co2WidthScale: 1 },
      display: { nibpLabel: 'NIBP', nibpMode: 'Manual', nibpValueSize: 30, nibpMapSize: 28, respValueSize: 56, nibpIntervalMs: 0, nibpMeasureMs: 8500 }
    },
    pediatric: {
      label: 'Pediatric',
      headerLabel: 'PEDIATRIC',
      defaults: { hr: 105, resp: 22, spo2: 99, co2: 36, sys: 100, dia: 62, temp: 37.0, cvp: 8, stProfile: 'normal', ecgGain: 1, ecgSweepSpeed: 25 },
      limits: { hrLow: 70, hrHigh: 160, respLow: 15, respHigh: 40, spo2Low: 92, spo2Critical: 88, sysLow: 75, co2High: 50, co2Low: 30, co2LowRespGate: 28, tempHigh: 38.8, cvpHigh: 12, icpHigh: 20 },
      controlRanges: {
        hr: { min: 40, max: 220 },
        resp: { min: 8, max: 60 },
        spo2: { min: 60, max: 100 },
        co2: { min: 10, max: 80 },
        sys: { min: 45, max: 180 },
        dia: { min: 20, max: 110 },
        cvp: { min: 0, max: 24 },
        temp: { min: 34, max: 40.5 }
      },
      waveProfile: { ecgScale: 0.92, ecgWidthScale: 0.9, plethScale: 1.06, plethWidthScale: 0.92, respScale: 0.92, respWidthScale: 0.9, co2Scale: 0.94, co2WidthScale: 0.9 },
      display: { nibpLabel: 'NIBP Peds', nibpMode: 'Auto 3 min', nibpValueSize: 28, nibpMapSize: 26, respValueSize: 52, nibpIntervalMs: 180000, nibpMeasureMs: 8000 }
    },
    neonate: {
      label: 'Neonate',
      headerLabel: 'NEONATE',
      defaults: { hr: 140, resp: 40, spo2: 98, co2: 34, sys: 72, dia: 45, temp: 36.8, cvp: 6, stProfile: 'normal', ecgGain: 2, ecgSweepSpeed: 50 },
      limits: { hrLow: 100, hrHigh: 180, respLow: 25, respHigh: 60, spo2Low: 90, spo2Critical: 85, sysLow: 60, co2High: 50, co2Low: 30, co2LowRespGate: 35, tempHigh: 38.5, cvpHigh: 10, icpHigh: 20 },
      controlRanges: {
        hr: { min: 70, max: 220 },
        resp: { min: 15, max: 80 },
        spo2: { min: 70, max: 100 },
        co2: { min: 10, max: 70 },
        sys: { min: 40, max: 120 },
        dia: { min: 20, max: 90 },
        cvp: { min: 0, max: 20 },
        temp: { min: 34, max: 39.5 }
      },
      waveProfile: { ecgScale: 0.76, ecgWidthScale: 0.72, plethScale: 0.82, plethWidthScale: 0.78, respScale: 0.7, respWidthScale: 0.72, co2Scale: 0.86, co2WidthScale: 0.78 },
      display: { nibpLabel: 'NIBP Neo', nibpMode: 'Auto 1 min', nibpValueSize: 26, nibpMapSize: 24, respValueSize: 48, nibpIntervalMs: 60000, nibpMeasureMs: 7000 }
    }
  };

  const PROFILES = {
    adult: {
      normal: { hr: 80, resp: 14, spo2: 99, co2: 38, sys: 120, dia: 80, temp: 37.0, cvp: 10, stProfile: 'normal' },
      tachy: { hr: 135, resp: 24, spo2: 97, co2: 35, sys: 110, dia: 70, temp: 37.4, cvp: 8, stProfile: 'nonspecific' },
      brady: { hr: 42, resp: 10, spo2: 98, co2: 40, sys: 100, dia: 60, temp: 36.5, cvp: 9, stProfile: 'normal' },
      hypoxia: { hr: 118, resp: 30, spo2: 82, co2: 32, sys: 126, dia: 76, temp: 37.2, cvp: 10, stProfile: 'depression' },
      shock: { hr: 145, resp: 32, spo2: 89, co2: 28, sys: 78, dia: 48, temp: 36.1, cvp: 4, stProfile: 'depression' },
      sedation: { hr: 58, resp: 8, spo2: 95, co2: 47, sys: 108, dia: 68, temp: 36.7, cvp: 11, stProfile: 'normal' },
      compensatedSepsis: { hr: 112, resp: 22, spo2: 96, co2: 33, sys: 102, dia: 60, temp: 38.9, cvp: 6, stProfile: 'nonspecific' },
      postIntubation: { hr: 72, resp: 12, spo2: 98, co2: 38, sys: 108, dia: 68, temp: 36.4, cvp: 12, stProfile: 'normal' }
    },
    pediatric: {
      normal: { hr: 105, resp: 22, spo2: 99, co2: 36, sys: 100, dia: 62, temp: 37.0, cvp: 8, stProfile: 'normal' },
      tachy: { hr: 165, resp: 34, spo2: 97, co2: 34, sys: 98, dia: 58, temp: 37.6, cvp: 7, stProfile: 'nonspecific' },
      brady: { hr: 62, resp: 16, spo2: 98, co2: 38, sys: 92, dia: 54, temp: 36.7, cvp: 8, stProfile: 'normal' },
      hypoxia: { hr: 150, resp: 38, spo2: 84, co2: 30, sys: 102, dia: 64, temp: 37.3, cvp: 8, stProfile: 'depression' },
      shock: { hr: 170, resp: 42, spo2: 90, co2: 26, sys: 74, dia: 38, temp: 36.4, cvp: 4, stProfile: 'depression' },
      sedation: { hr: 78, resp: 14, spo2: 97, co2: 44, sys: 94, dia: 56, temp: 36.8, cvp: 8, stProfile: 'normal' },
      compensatedSepsis: { hr: 148, resp: 30, spo2: 96, co2: 32, sys: 88, dia: 50, temp: 38.7, cvp: 6, stProfile: 'nonspecific' },
      postIntubation: { hr: 96, resp: 18, spo2: 98, co2: 36, sys: 92, dia: 56, temp: 36.6, cvp: 10, stProfile: 'normal' }
    },
    neonate: {
      normal: { hr: 140, resp: 40, spo2: 98, co2: 34, sys: 72, dia: 45, temp: 36.8, cvp: 6, stProfile: 'normal' },
      tachy: { hr: 185, resp: 52, spo2: 96, co2: 33, sys: 68, dia: 40, temp: 37.4, cvp: 5, stProfile: 'nonspecific' },
      brady: { hr: 95, resp: 24, spo2: 97, co2: 36, sys: 66, dia: 38, temp: 36.5, cvp: 6, stProfile: 'normal' },
      hypoxia: { hr: 175, resp: 58, spo2: 86, co2: 28, sys: 70, dia: 42, temp: 37.2, cvp: 6, stProfile: 'depression' },
      shock: { hr: 190, resp: 60, spo2: 88, co2: 24, sys: 58, dia: 32, temp: 36.2, cvp: 3, stProfile: 'depression' },
      sedation: { hr: 110, resp: 28, spo2: 96, co2: 42, sys: 68, dia: 40, temp: 36.7, cvp: 6, stProfile: 'normal' },
      compensatedSepsis: { hr: 168, resp: 50, spo2: 95, co2: 30, sys: 62, dia: 35, temp: 38.4, cvp: 5, stProfile: 'nonspecific' },
      postIntubation: { hr: 128, resp: 35, spo2: 97, co2: 34, sys: 66, dia: 40, temp: 36.5, cvp: 8, stProfile: 'normal' }
    }
  };

  const ST_PROFILES = {
    normal: { label: 'Normal ST', i: 0.0, ii: 0.0, v: 0.1 },
    nonspecific: { label: 'Nonspecific changes', i: -0.1, ii: -0.1, v: 0.0 },
    depression: { label: 'ST depression', i: -0.4, ii: -0.6, v: -0.5 },
    inferiorElevation: { label: 'Inferior STE', i: -0.2, ii: 0.8, v: -0.1 },
    anteriorElevation: { label: 'Anterior STE', i: 0.1, ii: 0.3, v: 1.2 }
  };

  const TREND_EVENTS = {
    desaturation: {
      label: 'Desaturation',
      durationMs: 12_000,
      holdMs: 5_000,
      profileKey: 'hypoxia',
      profile: 'acute',
      returnToBaseline: true
    },
    septicShock: {
      label: 'Septic shock',
      durationMs: 32_000,
      holdMs: 10_000,
      profileKey: 'shock',
      profile: 'gradual',
      returnToBaseline: true
    },
    hypoventilation: {
      label: 'Hypoventilation',
      durationMs: 16_000,
      holdMs: 4_000,
      profile: 'acute',
      returnToBaseline: true,
      targets: {
        adult: { hr: 64, resp: 6, spo2: 90, co2: 56, sys: 112, dia: 70, temp: 36.8, cvp: 10, stProfile: 'normal' },
        pediatric: { hr: 92, resp: 10, spo2: 90, co2: 58, sys: 96, dia: 58, temp: 36.9, cvp: 8, stProfile: 'normal' },
        neonate: { hr: 118, resp: 14, spo2: 88, co2: 60, sys: 68, dia: 40, temp: 36.7, cvp: 6, stProfile: 'normal' }
      }
    },
    recovery: {
      label: 'Recovery',
      durationMs: 20_000,
      holdMs: 8_000,
      profileKey: 'normal',
      profile: 'recovery',
      returnToBaseline: false
    },
    apnea: {
      label: 'Apnea',
      durationMs: 10_000,
      holdMs: 8_000,
      profile: 'acute',
      returnToBaseline: true,
      targets: {
        adult:     { hr: 48, resp: 4,  spo2: 70, co2: 68, sys: 86, dia: 50, temp: 36.8, cvp: 12, stProfile: 'nonspecific' },
        pediatric: { hr: 55, resp: 8,  spo2: 68, co2: 66, sys: 78, dia: 46, temp: 36.8, cvp:  9, stProfile: 'nonspecific' },
        neonate:   { hr: 80, resp: 15, spo2: 64, co2: 64, sys: 54, dia: 28, temp: 36.7, cvp:  7, stProfile: 'nonspecific' }
      }
    },
    bronchospasm: {
      label: 'Bronchospasm',
      durationMs: 14_000,
      holdMs: 6_000,
      profile: 'acute',
      returnToBaseline: true,
      targets: {
        adult:     { hr: 124, resp: 34, spo2: 84, co2: 58, sys: 148, dia: 94, temp: 37.2, cvp: 14, stProfile: 'nonspecific' },
        pediatric: { hr: 158, resp: 46, spo2: 82, co2: 56, sys: 118, dia: 72, temp: 37.2, cvp: 12, stProfile: 'nonspecific' },
        neonate:   { hr: 178, resp: 68, spo2: 78, co2: 58, sys:  82, dia: 48, temp: 37.1, cvp:  9, stProfile: 'nonspecific' }
      }
    },
    compensatedSepsis: {
      label: 'Compensated sepsis',
      durationMs: 28_000,
      holdMs: 0,
      profileKey: 'compensatedSepsis',
      profile: 'gradual',
      returnToBaseline: false
    },
    postIntubationRecovery: {
      label: 'Post-intubation recovery',
      durationMs: 22_000,
      holdMs: 0,
      profileKey: 'postIntubation',
      profile: 'gradual',
      returnToBaseline: false
    }
  };

  const DEFAULT_STATE = {
    alarmsEnabled: true,
    soundEnabled: true,
    alarmVolume: 0.1,
    asystoleActive: false,
    ecgLeadsOff: false,
    spo2ProbeOff: false,
    tempProbeOff: false,
    tempUnit: 'celsius',
    activeAlarms: [],
    lastAlarmBeep: 0,
    lastHeartBeatAt: 0,
    audioUnlocked: false,
    running: true,
    showGrid: true,
    showDiagnostic: true,
    patientCategory: 'adult',
    channel2Type: 'cvp',
    stProfile: 'normal',
    patientName: '',
    ecgGain: 1,
    ecgSweepSpeed: 25,
    trendEvent: 'none',
    trendRunning: false,
    trendStartedAt: 0,
    trendDurationMs: 0,
    trendDurationOverrideMs: 0,
    trendHoldMs: 0,
    trendHoldOverrideMs: 0,
    trendPhase: 'idle',
    nibpMeasurementActive: false,
    nibpMeasurementStartedAt: 0,
    nibpLastMeasurementAt: 0,
    nibpNextMeasurementAt: 0,
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
  const dynamicKeys = ['hr', 'resp', 'spo2', 'co2', 'sys', 'dia', 'temp', 'cvp'];
  let trendBaseline = null;

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

    const categoryKey = PATIENT_CATEGORIES.includes(input.patientCategory) ? input.patientCategory : state.patientCategory;
    const categoryConfig = PATIENT_CATEGORY_CONFIGS[categoryKey] || PATIENT_CATEGORY_CONFIGS[DEFAULT_STATE.patientCategory];

    numericKeys.forEach((cfg, key) => {
      if (!(key in input)) {
        return;
      }
      const raw = Number(input[key]);
      if (!Number.isFinite(raw)) {
        return;
      }
      const range = categoryConfig.controlRanges?.[key] || {};
      const min = range.min ?? cfg.min;
      const max = range.max ?? cfg.max;
      const step = range.step ?? cfg.step;
      patch[key] = roundByStep(clamp(raw, min, max), step);
    });

    ['alarmsEnabled', 'soundEnabled', 'running', 'showGrid', 'showDiagnostic', 'ecgLeadsOff', 'spo2ProbeOff', 'tempProbeOff', 'asystoleActive'].forEach(key => {
      if (key in input) {
        patch[key] = Boolean(input[key]);
      }
    });

    if ('tempUnit' in input) {
      patch.tempUnit = input.tempUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    }

    if ('alarmVolume' in input) {
      const raw = Number(input.alarmVolume);
      if (Number.isFinite(raw)) {
        patch.alarmVolume = clamp(raw, 0, 1);
      }
    }

    if ('channel2Type' in input) {
      patch.channel2Type = CHANNEL2_TYPES.includes(input.channel2Type) ? input.channel2Type : DEFAULT_STATE.channel2Type;
    }

    if ('patientCategory' in input) {
      patch.patientCategory = PATIENT_CATEGORIES.includes(input.patientCategory) ? input.patientCategory : DEFAULT_STATE.patientCategory;
    }

    if ('stProfile' in input) {
      patch.stProfile = ST_PROFILES[input.stProfile] ? input.stProfile : DEFAULT_STATE.stProfile;
    }

    if ('patientName' in input) {
      patch.patientName = String(input.patientName || '').trim().slice(0, 24);
    }

    if ('ecgGain' in input) {
      const raw = Number(input.ecgGain);
      patch.ecgGain = ECG_GAINS.includes(raw) ? raw : DEFAULT_STATE.ecgGain;
    }

    if ('ecgSweepSpeed' in input) {
      const raw = Number(input.ecgSweepSpeed);
      patch.ecgSweepSpeed = ECG_SWEEP_SPEEDS.includes(raw) ? raw : DEFAULT_STATE.ecgSweepSpeed;
    }

    if ('trendEvent' in input) {
      patch.trendEvent = TREND_EVENTS[input.trendEvent] ? input.trendEvent : 'none';
    }

    if ('trendDurationOverrideMs' in input) {
      const raw = Number(input.trendDurationOverrideMs);
      if (Number.isFinite(raw)) {
        patch.trendDurationOverrideMs = clamp(Math.round(raw), 0, 180000);
      }
    }

    if ('trendHoldOverrideMs' in input) {
      const raw = Number(input.trendHoldOverrideMs);
      if (Number.isFinite(raw)) {
        patch.trendHoldOverrideMs = clamp(Math.round(raw), 0, 120000);
      }
    }

    if ('trendPhase' in input) {
      patch.trendPhase = ['idle', 'onset', 'hold', 'return'].includes(input.trendPhase) ? input.trendPhase : 'idle';
    }

    ['trendRunning', 'nibpMeasurementActive'].forEach(key => {
      if (key in input) {
        patch[key] = Boolean(input[key]);
      }
    });

    ['trendStartedAt', 'trendDurationMs', 'trendHoldMs', 'nibpMeasurementStartedAt', 'nibpLastMeasurementAt', 'nibpNextMeasurementAt'].forEach(key => {
      if (key in input) {
        const raw = Number(input[key]);
        if (Number.isFinite(raw)) {
          patch[key] = Math.max(0, Math.round(raw));
        }
      }
    });

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

  function updateInternalState(patch, meta = { source: 'local' }) {
    let changed = false;
    Object.entries(patch).forEach(([key, value]) => {
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
      asystoleActive: state.asystoleActive,
      ecgLeadsOff: state.ecgLeadsOff,
      spo2ProbeOff: state.spo2ProbeOff,
      tempProbeOff: state.tempProbeOff,
      tempUnit: state.tempUnit,
      running: state.running,
      showGrid: state.showGrid,
      showDiagnostic: state.showDiagnostic,
      patientCategory: state.patientCategory,
      channel2Type: state.channel2Type,
      stProfile: state.stProfile,
      patientName: state.patientName,
      ecgGain: state.ecgGain,
      ecgSweepSpeed: state.ecgSweepSpeed,
      trendEvent: state.trendEvent,
      trendRunning: state.trendRunning,
      trendStartedAt: state.trendStartedAt,
      trendDurationMs: state.trendDurationMs,
      trendDurationOverrideMs: state.trendDurationOverrideMs,
      trendHoldMs: state.trendHoldMs,
      trendHoldOverrideMs: state.trendHoldOverrideMs,
      trendPhase: state.trendPhase,
      nibpMeasurementActive: state.nibpMeasurementActive,
      nibpMeasurementStartedAt: state.nibpMeasurementStartedAt,
      nibpLastMeasurementAt: state.nibpLastMeasurementAt,
      nibpNextMeasurementAt: state.nibpNextMeasurementAt,
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
    const category = PATIENT_CATEGORY_CONFIGS[state.patientCategory] ? state.patientCategory : DEFAULT_STATE.patientCategory;
    if (!PROFILES[category] || !PROFILES[category][name]) {
      return false;
    }
    trendBaseline = null;
    const changed = updateInternalState(
      {
        trendEvent: 'none',
        trendRunning: false,
        trendStartedAt: 0,
        trendDurationMs: 0,
        trendDurationOverrideMs: 0,
        trendHoldMs: 0,
        trendHoldOverrideMs: 0,
        trendPhase: 'idle',
        asystoleActive: false,
        nibpMeasurementActive: false,
        nibpMeasurementStartedAt: 0
      },
      meta
    );
    configureNibpSchedule(Date.now(), { ...meta, skipBroadcast: true });
    return setState(PROFILES[category][name], meta) || changed;
  }

  function applyPatientCategory(name, meta = { source: 'local' }) {
    const category = PATIENT_CATEGORY_CONFIGS[name] ? name : DEFAULT_STATE.patientCategory;
    trendBaseline = null;
    const changed = setState({ patientCategory: category, asystoleActive: false, ...PATIENT_CATEGORY_CONFIGS[category].defaults }, meta);
    configureNibpSchedule(Date.now(), meta);
    stopTrend(meta, false);
    return changed;
  }

  function setAsystole(active, meta = { source: 'local' }) {
    const nextActive = Boolean(active);
    trendBaseline = null;

    if (nextActive) {
      return updateInternalState(
        {
          asystoleActive: true,
          trendEvent: 'none',
          trendRunning: false,
          trendStartedAt: 0,
          trendDurationMs: 0,
          trendHoldMs: 0,
          trendPhase: 'idle'
        },
        meta
      );
    }

    return updateInternalState({ asystoleActive: false }, meta);
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

  function getStMeasurements(currentState = state) {
    const key = ST_PROFILES[currentState.stProfile] ? currentState.stProfile : DEFAULT_STATE.stProfile;
    return ST_PROFILES[key];
  }

  function getPatientCategoryConfig(currentState = state) {
    const key = PATIENT_CATEGORY_CONFIGS[currentState.patientCategory] ? currentState.patientCategory : DEFAULT_STATE.patientCategory;
    return PATIENT_CATEGORY_CONFIGS[key];
  }

  function getTrendTarget(currentState = state, eventName = state.trendEvent) {
    const category = currentState.patientCategory;
    const event = TREND_EVENTS[eventName];
    if (!event) {
      return null;
    }
    if (event.profileKey) {
      return PROFILES[category]?.[event.profileKey] || null;
    }
    return event.targets?.[category] || null;
  }

  function getTrendDuration(eventName, currentState = state) {
    const event = TREND_EVENTS[eventName];
    if (!event) {
      return 0;
    }
    return currentState.trendDurationOverrideMs > 0 ? currentState.trendDurationOverrideMs : event.durationMs;
  }

  function getTrendHold(eventName, currentState = state) {
    const event = TREND_EVENTS[eventName];
    if (!event) {
      return 0;
    }
    return currentState.trendHoldOverrideMs > 0 ? currentState.trendHoldOverrideMs : (event.holdMs || 0);
  }

  function getTrendProfileLabel(eventName) {
    const event = TREND_EVENTS[eventName];
    if (!event) {
      return 'Custom';
    }
    if (event.profile === 'acute') {
      return 'Acute';
    }
    if (event.profile === 'gradual') {
      return 'Gradual';
    }
    if (event.profile === 'recovery') {
      return 'Recovery';
    }
    return 'Custom';
  }

  function getTrendPhaseLabel(phase) {
    if (phase === 'onset') {
      return 'Onset';
    }
    if (phase === 'hold') {
      return 'Hold';
    }
    if (phase === 'return') {
      return 'Return';
    }
    return 'Idle';
  }

  function stopTrend(meta = { source: 'local' }, keepEventName = false) {
    trendBaseline = null;
    return updateInternalState(
      {
        trendEvent: keepEventName ? state.trendEvent : 'none',
        trendRunning: false,
        trendStartedAt: 0,
        trendDurationMs: 0,
        trendHoldMs: 0,
        trendPhase: 'idle'
      },
      meta
    );
  }

  function startTrend(name, now = Date.now(), meta = { source: 'local' }) {
    if (!TREND_EVENTS[name]) {
      return false;
    }
    trendBaseline = Object.fromEntries(dynamicKeys.map(key => [key, state[key]]));
    trendBaseline.stProfile = state.stProfile;
    const durationMs = getTrendDuration(name, state);
    const holdMs = getTrendHold(name, state);
    return updateInternalState(
      {
        trendEvent: name,
        trendRunning: true,
        trendStartedAt: now,
        trendDurationMs: durationMs,
        trendHoldMs: holdMs,
        trendPhase: 'onset'
      },
      meta
    );
  }

  function configureNibpSchedule(now = Date.now(), meta = { source: 'local' }) {
    const display = getPatientCategoryConfig(state).display;
    return updateInternalState(
      {
        nibpMeasurementActive: false,
        nibpMeasurementStartedAt: 0,
        nibpLastMeasurementAt: state.nibpLastMeasurementAt,
        nibpNextMeasurementAt: display.nibpIntervalMs > 0 ? now + display.nibpIntervalMs : 0
      },
      meta
    );
  }

  function startNibpMeasurement(now = Date.now(), meta = { source: 'local' }) {
    if (state.nibpMeasurementActive) {
      return false;
    }
    return updateInternalState(
      {
        nibpMeasurementActive: true,
        nibpMeasurementStartedAt: now
      },
      meta
    );
  }

  function tickDynamicState(now = Date.now(), meta = { source: 'local' }) {
    let changed = false;
    const category = getPatientCategoryConfig(state);
    const nibpMeasureMs = Math.max(1, category.display.nibpMeasureMs || 0);

    if (state.trendRunning && TREND_EVENTS[state.trendEvent]) {
      const event = TREND_EVENTS[state.trendEvent];
      const target = getTrendTarget(state, state.trendEvent);
      if (!trendBaseline || !target) {
        changed = stopTrend(meta) || changed;
      } else {
        const elapsed = Math.max(0, now - state.trendStartedAt);
        const onsetMs = Math.max(1, state.trendDurationMs);
        const holdMs = Math.max(0, state.trendHoldMs);
        const returnMs = event.returnToBaseline === false ? 0 : onsetMs;
        let phase = 'onset';
        let finished = false;
        const patch = {};
        if (elapsed < onsetMs) {
          const progress = clamp(elapsed / onsetMs, 0, 1);
          dynamicKeys.forEach(key => {
            if (!Number.isFinite(target[key]) || !Number.isFinite(trendBaseline[key])) {
              return;
            }
            patch[key] = trendBaseline[key] + (target[key] - trendBaseline[key]) * progress;
          });
          if (target.stProfile && progress >= 0.6) {
            patch.stProfile = target.stProfile;
          }
        } else if (elapsed < onsetMs + holdMs) {
          phase = 'hold';
          dynamicKeys.forEach(key => {
            if (!Number.isFinite(target[key])) {
              return;
            }
            patch[key] = target[key];
          });
          if (target.stProfile) {
            patch.stProfile = target.stProfile;
          }
        } else if (returnMs > 0 && elapsed < onsetMs + holdMs + returnMs) {
          phase = 'return';
          const progress = clamp((elapsed - onsetMs - holdMs) / returnMs, 0, 1);
          dynamicKeys.forEach(key => {
            if (!Number.isFinite(target[key]) || !Number.isFinite(trendBaseline[key])) {
              return;
            }
            patch[key] = target[key] + (trendBaseline[key] - target[key]) * progress;
          });
          patch.stProfile = progress >= 0.5 ? trendBaseline.stProfile : (target.stProfile || trendBaseline.stProfile);
        } else {
          if (event.returnToBaseline === false) {
            dynamicKeys.forEach(key => {
              if (!Number.isFinite(target[key])) {
                return;
              }
              patch[key] = target[key];
            });
            if (target.stProfile) {
              patch.stProfile = target.stProfile;
            }
            changed = setState(patch, meta) || changed;
          } else {
            dynamicKeys.forEach(key => {
              if (!Number.isFinite(trendBaseline[key])) {
                return;
              }
              patch[key] = trendBaseline[key];
            });
            patch.stProfile = trendBaseline.stProfile;
            changed = setState(patch, meta) || changed;
          }
          changed = stopTrend(meta) || changed;
          finished = true;
        }
        if (!finished) {
          patch.trendPhase = phase;
          changed = setState(patch, meta) || changed;
        }
      }
    }

    if (state.nibpMeasurementActive) {
      if (now - state.nibpMeasurementStartedAt >= nibpMeasureMs) {
        changed = updateInternalState(
          {
            nibpMeasurementActive: false,
            nibpMeasurementStartedAt: 0,
            nibpLastMeasurementAt: now,
            nibpNextMeasurementAt: category.display.nibpIntervalMs > 0 ? now + category.display.nibpIntervalMs : 0
          },
          meta
        ) || changed;
      }
      return changed;
    }

    if (category.display.nibpIntervalMs <= 0) {
      if (state.nibpNextMeasurementAt) {
        changed = updateInternalState(
          {
            nibpNextMeasurementAt: 0
          },
          meta
        ) || changed;
      }
      return changed;
    }

    if (!state.nibpNextMeasurementAt) {
      changed = updateInternalState({ nibpNextMeasurementAt: now + category.display.nibpIntervalMs }, meta) || changed;
    }

    if (now >= state.nibpNextMeasurementAt) {
      changed = startNibpMeasurement(now, meta) || changed;
    }

    return changed;
  }

  function getControlRangeConfig(key, currentState = state) {
    const base = numericKeys.get(key);
    if (!base) {
      return null;
    }
    const category = getPatientCategoryConfig(currentState);
    return {
      ...base,
      ...(category.controlRanges?.[key] || {})
    };
  }

  App.state = {
    CHANNEL2_TYPES,
    CONTROL_CONFIG,
    DEFAULT_STATE,
    ECG_GAINS,
    ECG_SWEEP_SPEEDS,
    PATIENT_CATEGORIES,
    PATIENT_CATEGORY_CONFIGS,
    PROFILES,
    ST_PROFILES,
    TREND_EVENTS,
    applyPatientCategory,
    applyProfile,
    clamp,
    configureNibpSchedule,
    getChannel2Display,
    getControlRangeConfig,
    getPatientCategoryConfig,
    getTrendDuration,
    getTrendHold,
    getTrendPhaseLabel,
    getTrendProfileLabel,
    getStMeasurements,
    getTrendTarget,
    getSerializableState,
    getState,
    mapPressureValue,
    replaceState,
    sanitizePatch,
    setAsystole,
    setState,
    startNibpMeasurement,
    startTrend,
    state,
    stopTrend,
    subscribe
    ,tickDynamicState
  };
})();

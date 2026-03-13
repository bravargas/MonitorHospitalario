(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});
  const ATLS_CASES_PATH = 'data/atls_fictitious_cases.json';

  function inferPatientCategory(age) {
    const normalizedAge = Number(age);
    if (!Number.isFinite(normalizedAge)) {
      return 'adult';
    }
    if (normalizedAge < 1) {
      return 'neonate';
    }
    if (normalizedAge < 18) {
      return 'pediatric';
    }
    return 'adult';
  }

  function normalizePatientText(value) {
    const text = String(value ?? '').trim();
    return text ? text : 'N/A';
  }

  function formatPatientDisplay(patient) {
    const data = patient && typeof patient === 'object' ? patient : {};
    const sex = normalizePatientText(data.sex);
    const age = normalizePatientText(data.age);
    return `${sex} (${age})`;
  }

  function parseBloodPressure(value) {
    const match = String(value || '').match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) {
      return { sys: null, dia: null };
    }
    return {
      sys: Number(match[1]),
      dia: Number(match[2])
    };
  }

  function buildAtlsVitalsPatch(initialVitals) {
    const vitals = initialVitals && typeof initialVitals === 'object' ? initialVitals : {};
    const pressure = parseBloodPressure(vitals.blood_pressure_mmHg);
    const patch = {};

    if (Number.isFinite(Number(vitals.heart_rate_bpm))) {
      patch.hr = Number(vitals.heart_rate_bpm);
    }
    if (Number.isFinite(Number(vitals.respiratory_rate_bpm))) {
      patch.resp = Number(vitals.respiratory_rate_bpm);
    }
    if (Number.isFinite(Number(vitals.spo2_percent))) {
      patch.spo2 = Number(vitals.spo2_percent);
    }
    if (Number.isFinite(Number(vitals.temperature_c))) {
      patch.temp = Number(vitals.temperature_c);
    }
    if (Number.isFinite(pressure.sys)) {
      patch.sys = pressure.sys;
    }
    if (Number.isFinite(pressure.dia)) {
      patch.dia = pressure.dia;
    }

    return patch;
  }

  function renderAtlsCasePreview(caseData) {
    if (!caseData) {
      return 'No case selected.';
    }

    const patient = caseData.patient || {};
    const scenario = caseData.scenario || {};
    const initialVitals = caseData.initial_vitals || {};
    const patientCategory = inferPatientCategory(patient.age);
    const bloodPressure = initialVitals.blood_pressure_mmHg || '--/--';
    const gcs = Number.isFinite(Number(initialVitals.gcs)) ? initialVitals.gcs : '--';

    return `
      <div class="case-preview-title">${caseData.id} - ${caseData.title}</div>
      <div class="case-preview-line">Patient: ${formatPatientDisplay(patient)} • ${patientCategory}</div>
      <div class="case-preview-line">Scenario: ${scenario.setting || 'N/A'} • ${scenario.chief_complaint || 'No complaint listed'}</div>
      <div class="case-preview-line">Initial vitals: HR ${initialVitals.heart_rate_bpm ?? '--'} bpm • BP ${bloodPressure} mmHg • RESP ${initialVitals.respiratory_rate_bpm ?? '--'} rpm • SpO2 ${initialVitals.spo2_percent ?? '--'}% • Temp ${initialVitals.temperature_c ?? '--'} C • GCS ${gcs}</div>
    `;
  }

  function loadAtlsDatasetWithXhr() {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', ATLS_CASES_PATH, true);
      request.responseType = 'text';
      request.onload = () => {
        if ((request.status >= 200 && request.status < 300) || request.status === 0) {
          try {
            resolve(JSON.parse(request.responseText));
          } catch (error) {
            reject(error);
          }
          return;
        }
        reject(new Error(`HTTP ${request.status}`));
      };
      request.onerror = () => reject(new Error('Network error'));
      request.send();
    });
  }

  async function loadAtlsDataset() {
    if (App.atlsCasesDataset && Array.isArray(App.atlsCasesDataset.cases)) {
      return App.atlsCasesDataset;
    }

    try {
      const response = await fetch(ATLS_CASES_PATH, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return loadAtlsDatasetWithXhr();
    }
  }

  function mountControlPage() {
    const currentState = App.state.getState();
    const controlsRoot = document.getElementById('controls');
    const cache = {
      numeric: {},
      ranges: {}
    };
    let atlsDataset = null;
    let atlsCasesById = new Map();

    if (!controlsRoot) {
      return null;
    }

    controlsRoot.innerHTML = '';

    App.state.CONTROL_CONFIG.forEach(cfg => {
      const wrap = document.createElement('div');
      wrap.className = 'control';
      wrap.innerHTML = `
        <div class="control-top">
          <label for="num-${cfg.key}">${cfg.label}</label>
          <div class="value-box">
            <input id="num-${cfg.key}" type="number" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${currentState[cfg.key]}" />
            <span class="unit">${cfg.unit}</span>
          </div>
        </div>
        <input id="range-${cfg.key}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${currentState[cfg.key]}" />
      `;
      controlsRoot.appendChild(wrap);

      const numberInput = wrap.querySelector(`#num-${cfg.key}`);
      const rangeInput = wrap.querySelector(`#range-${cfg.key}`);
      cache.numeric[cfg.key] = numberInput;
      cache.ranges[cfg.key] = rangeInput;

      const syncValue = value => {
        App.state.setState({ [cfg.key]: value }, { source: 'local' });
      };

      numberInput.addEventListener('input', event => syncValue(event.target.value));
      rangeInput.addEventListener('input', event => syncValue(event.target.value));
    });

    document.querySelectorAll('[data-profile]').forEach(button => {
      button.addEventListener('click', () => App.state.applyProfile(button.dataset.profile, { source: 'local' }));
    });

    const setActiveTab = targetId => {
      document.querySelectorAll('[data-tab-target]').forEach(button => {
        const isActive = button.dataset.tabTarget === targetId;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
      });

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === targetId);
      });
    };

    document.querySelectorAll('[data-tab-target]').forEach(button => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tabTarget));
    });

    const atlsCaseSelect = document.getElementById('atlsCaseSelect');
    const atlsCaseStatus = document.getElementById('atlsCaseStatus');
    const atlsCasePreview = document.getElementById('atlsCasePreview');
    const loadAtlsCaseButton = document.getElementById('btnLoadATLSCase');

    const updateAtlsCaseSelection = caseId => {
      const selectedCase = atlsCasesById.get(caseId) || null;
      if (atlsCasePreview) {
        atlsCasePreview.classList.toggle('empty', !selectedCase);
        atlsCasePreview.innerHTML = renderAtlsCasePreview(selectedCase);
      }
      if (loadAtlsCaseButton) {
        loadAtlsCaseButton.disabled = !selectedCase;
      }
    };

    atlsCaseSelect?.addEventListener('change', event => {
      updateAtlsCaseSelection(event.target.value);
    });

    loadAtlsCaseButton?.addEventListener('click', () => {
      const caseId = atlsCaseSelect?.value || '';
      const selectedCase = atlsCasesById.get(caseId);
      if (!selectedCase) {
        if (atlsCaseStatus) {
          atlsCaseStatus.textContent = 'Select a case before loading it.';
        }
        return;
      }

      const patient = selectedCase.patient || {};
      const inferredCategory = inferPatientCategory(patient.age);
      const vitalsPatch = buildAtlsVitalsPatch(selectedCase.initial_vitals);

      App.state.applyPatientCategory(inferredCategory, { source: 'local' });
      App.state.setState(
        {
          patientName: formatPatientDisplay(patient),
          ...vitalsPatch
        },
        { source: 'local' }
      );

      if (atlsCaseStatus) {
        atlsCaseStatus.textContent = `${selectedCase.id} loaded. ${inferredCategory} defaults applied, then initial vitals and patient name were updated.`;
      }
    });

    loadAtlsDataset()
      .then(dataset => {
        atlsDataset = dataset;
        const cases = Array.isArray(dataset?.cases) ? dataset.cases : [];
        atlsCasesById = new Map(cases.map(caseData => [caseData.id, caseData]));

        if (atlsCaseSelect) {
          atlsCaseSelect.innerHTML = '<option value="">Select case...</option>';
          (Array.isArray(dataset?.case_index) ? dataset.case_index : []).forEach(entry => {
            const option = document.createElement('option');
            option.value = entry.id;
            option.textContent = `${entry.id} - ${entry.title}`;
            atlsCaseSelect.appendChild(option);
          });
        }

        const initialCaseId = dataset?.navigation?.entry_case_id || '';
        if (atlsCaseSelect && initialCaseId && atlsCasesById.has(initialCaseId)) {
          atlsCaseSelect.value = initialCaseId;
        }
        updateAtlsCaseSelection(atlsCaseSelect?.value || '');

        if (atlsCaseStatus) {
          atlsCaseStatus.textContent = `${atlsCasesById.size} ATLS cases available from ${ATLS_CASES_PATH}.`;
        }
      })
      .catch(error => {
        if (atlsCaseStatus) {
          atlsCaseStatus.textContent = `ATLS cases could not be loaded from ${ATLS_CASES_PATH}: ${error.message}. If you are opening the app with file://, use a local server for JSON-backed case selection.`;
        }
        updateAtlsCaseSelection('');
      });

    document.getElementById('showGrid')?.addEventListener('change', event => {
      App.state.setState({ showGrid: event.target.checked }, { source: 'local' });
    });

    document.getElementById('showDiagnostic')?.addEventListener('change', event => {
      App.state.setState({ showDiagnostic: event.target.checked }, { source: 'local' });
    });

    document.getElementById('alarmsEnabled')?.addEventListener('change', event => {
      App.state.setState({ alarmsEnabled: event.target.checked }, { source: 'local' });
    });

    document.getElementById('soundEnabled')?.addEventListener('change', event => {
      App.state.setState({ soundEnabled: event.target.checked }, { source: 'local' });
    });

    ['ecgLeadsOff', 'spo2ProbeOff', 'tempProbeOff'].forEach(key => {
      document.getElementById(key)?.addEventListener('change', event => {
        App.state.setState({ [key]: event.target.checked }, { source: 'local' });
      });
    });

    document.getElementById('patientCategory')?.addEventListener('change', event => {
      App.state.applyPatientCategory(event.target.value, { source: 'local' });
    });

    document.getElementById('channel2Type')?.addEventListener('change', event => {
      App.state.setState({ channel2Type: event.target.value }, { source: 'local' });
    });

    document.getElementById('stProfile')?.addEventListener('change', event => {
      App.state.setState({ stProfile: event.target.value }, { source: 'local' });
    });

    document.getElementById('patientName')?.addEventListener('input', event => {
      App.state.setState({ patientName: event.target.value }, { source: 'local' });
    });

    document.getElementById('ecgGain')?.addEventListener('change', event => {
      App.state.setState({ ecgGain: Number(event.target.value) }, { source: 'local' });
    });

    document.getElementById('ecgSweepSpeed')?.addEventListener('change', event => {
      App.state.setState({ ecgSweepSpeed: Number(event.target.value) }, { source: 'local' });
    });

    document.getElementById('tempUnit')?.addEventListener('change', event => {
      App.state.setState({ tempUnit: event.target.value }, { source: 'local' });
    });

    document.getElementById('trendEvent')?.addEventListener('change', event => {
      const eventName = event.target.value;
      const preset = App.state.TREND_EVENTS[eventName];
      if (document.getElementById('trendDurationSeconds')) {
        document.getElementById('trendDurationSeconds').value = String(Math.round((preset?.durationMs || 0) / 1000));
      }
      if (document.getElementById('trendHoldSeconds')) {
        document.getElementById('trendHoldSeconds').value = String(Math.round((preset?.holdMs || 0) / 1000));
      }
      if (document.getElementById('trendPresetHint')) {
        document.getElementById('trendPresetHint').textContent = `${preset?.label || 'Event'} uses an ${App.state.getTrendProfileLabel(eventName).toLowerCase()} preset with ${Math.round((preset?.holdMs || 0) / 1000)}s hold.`;
      }
      App.state.setState(
        {
          trendEvent: eventName,
          trendDurationOverrideMs: preset?.durationMs || 0,
          trendHoldOverrideMs: preset?.holdMs || 0
        },
        { source: 'local' }
      );
    });

    document.getElementById('trendDurationSeconds')?.addEventListener('input', event => {
      const seconds = Math.max(0, Number(event.target.value) || 0);
      App.state.setState({ trendDurationOverrideMs: Math.round(seconds * 1000) }, { source: 'local' });
    });

    document.getElementById('trendHoldSeconds')?.addEventListener('input', event => {
      const seconds = Math.max(0, Number(event.target.value) || 0);
      App.state.setState({ trendHoldOverrideMs: Math.round(seconds * 1000) }, { source: 'local' });
    });

    document.getElementById('btnStartTrend')?.addEventListener('click', () => {
      const trendEvent = document.getElementById('trendEvent')?.value;
      if (trendEvent) {
        App.state.startTrend(trendEvent, Date.now(), { source: 'local' });
      }
    });

    document.getElementById('btnStopTrend')?.addEventListener('click', () => {
      App.state.stopTrend({ source: 'local' });
    });

    document.getElementById('btnNibpNow')?.addEventListener('click', () => {
      App.state.startNibpMeasurement(Date.now(), { source: 'local' });
    });

    document.getElementById('btnAsystole')?.addEventListener('click', () => {
      const currentState = App.state.getState();
      App.state.setAsystole(!currentState.asystoleActive, { source: 'local' });
    });

    const syncAlarmVolume = value => {
      const normalized = App.state.clamp(Number(value) || 0, 0, 100);
      App.state.setState({ alarmVolume: normalized / 100 }, { source: 'local' });
    };

    document.getElementById('alarmVolume')?.addEventListener('input', event => syncAlarmVolume(event.target.value));
    document.getElementById('alarmVolumeNumber')?.addEventListener('input', event => syncAlarmVolume(event.target.value));

    document.getElementById('btnStart')?.addEventListener('click', () => {
      App.state.setState({ running: !App.state.getState().running }, { source: 'local' });
    });

    document.getElementById('btnReset')?.addEventListener('click', () => {
      App.state.applyProfile('normal', { source: 'local' });
    });

    document.getElementById('btnOpenMonitor')?.addEventListener('click', () => {
      window.open('monitor.html', '_blank', 'noopener,noreferrer');
    });

    return {
      refresh() {
        const nextState = App.state.getState();
        App.state.CONTROL_CONFIG.forEach(cfg => {
          const bounds = App.state.getControlRangeConfig(cfg.key, nextState);
          if (cache.numeric[cfg.key]) {
            cache.numeric[cfg.key].min = bounds.min;
            cache.numeric[cfg.key].max = bounds.max;
            cache.numeric[cfg.key].step = bounds.step;
            cache.numeric[cfg.key].value = nextState[cfg.key];
          }
          if (cache.ranges[cfg.key]) {
            cache.ranges[cfg.key].min = bounds.min;
            cache.ranges[cfg.key].max = bounds.max;
            cache.ranges[cfg.key].step = bounds.step;
            cache.ranges[cfg.key].value = nextState[cfg.key];
          }
        });

        const startButton = document.getElementById('btnStart');
        if (startButton) {
          startButton.textContent = nextState.running ? 'Pause' : 'Start';
          startButton.classList.toggle('active', nextState.running);
        }

        const alarmVolume = Math.round(nextState.alarmVolume * 100);
        if (document.getElementById('alarmVolume')) {
          document.getElementById('alarmVolume').value = alarmVolume;
        }
        if (document.getElementById('alarmVolumeNumber')) {
          document.getElementById('alarmVolumeNumber').value = alarmVolume;
        }

        if (document.getElementById('showGrid')) {
          document.getElementById('showGrid').checked = nextState.showGrid;
        }
        if (document.getElementById('showDiagnostic')) {
          document.getElementById('showDiagnostic').checked = nextState.showDiagnostic;
        }
        if (document.getElementById('alarmsEnabled')) {
          document.getElementById('alarmsEnabled').checked = nextState.alarmsEnabled;
        }
        if (document.getElementById('soundEnabled')) {
          document.getElementById('soundEnabled').checked = nextState.soundEnabled;
        }
        ['ecgLeadsOff', 'spo2ProbeOff', 'tempProbeOff'].forEach(key => {
          if (document.getElementById(key)) {
            document.getElementById(key).checked = nextState[key];
          }
        });
        if (document.getElementById('patientCategory')) {
          document.getElementById('patientCategory').value = nextState.patientCategory;
        }
        if (document.getElementById('channel2Type')) {
          document.getElementById('channel2Type').value = nextState.channel2Type;
        }
        if (document.getElementById('stProfile')) {
          document.getElementById('stProfile').value = nextState.stProfile;
        }
        if (document.getElementById('patientName')) {
          document.getElementById('patientName').value = nextState.patientName;
        }
        if (atlsDataset && atlsCasePreview && !atlsCasePreview.classList.contains('empty')) {
          const selectedCase = atlsCasesById.get(atlsCaseSelect?.value || '');
          atlsCasePreview.innerHTML = renderAtlsCasePreview(selectedCase || null);
        }
        if (document.getElementById('ecgGain')) {
          document.getElementById('ecgGain').value = String(nextState.ecgGain);
        }
        if (document.getElementById('ecgSweepSpeed')) {
          document.getElementById('ecgSweepSpeed').value = String(nextState.ecgSweepSpeed);
        }
        if (document.getElementById('trendEvent')) {
          document.getElementById('trendEvent').value = nextState.trendEvent === 'none' ? 'desaturation' : nextState.trendEvent;
        }
        if (document.getElementById('trendDurationSeconds')) {
          const fallbackEvent = nextState.trendEvent === 'none' ? document.getElementById('trendEvent')?.value : nextState.trendEvent;
          const durationMs = nextState.trendDurationOverrideMs || App.state.getTrendDuration(fallbackEvent, nextState);
          document.getElementById('trendDurationSeconds').value = String(Math.max(1, Math.round(durationMs / 1000)));
        }
        if (document.getElementById('trendHoldSeconds')) {
          const fallbackEvent = nextState.trendEvent === 'none' ? document.getElementById('trendEvent')?.value : nextState.trendEvent;
          const holdMs = nextState.trendHoldOverrideMs || App.state.getTrendHold(fallbackEvent, nextState);
          document.getElementById('trendHoldSeconds').value = String(Math.max(0, Math.round(holdMs / 1000)));
        }
        if (document.getElementById('trendPresetHint')) {
          const selectedEvent = document.getElementById('trendEvent')?.value || 'desaturation';
          const preset = App.state.TREND_EVENTS[selectedEvent];
          document.getElementById('trendPresetHint').textContent = `${preset?.label || 'Event'} uses an ${App.state.getTrendProfileLabel(selectedEvent).toLowerCase()} preset with ${Math.round((preset?.holdMs || 0) / 1000)}s hold.`;
        }

        if (document.getElementById('mHr')) document.getElementById('mHr').textContent = nextState.hr;
        if (document.getElementById('mHr') && nextState.asystoleActive) document.getElementById('mHr').textContent = '0';
        if (document.getElementById('mSpO2')) document.getElementById('mSpO2').textContent = nextState.spo2;
        if (document.getElementById('mResp')) document.getElementById('mResp').textContent = nextState.resp;
        if (document.getElementById('mBP')) document.getElementById('mBP').textContent = `${nextState.sys}/${nextState.dia}`;

        const asystoleButton = document.getElementById('btnAsystole');
        if (asystoleButton) {
          asystoleButton.textContent = nextState.asystoleActive ? 'Stop asystole' : 'Start asystole';
          asystoleButton.classList.toggle('active', nextState.asystoleActive);
        }

        const alarmBanner = document.getElementById('alarmBanner');
        const alarmText = document.getElementById('alarmText');
        const trendStatus = document.getElementById('trendStatus');
        if (alarmBanner && alarmText) {
          if (nextState.activeAlarms.length === 0) {
            alarmBanner.style.display = 'none';
            alarmText.textContent = 'No alarms';
            alarmBanner.classList.remove('advisory', 'danger');
          } else {
            alarmBanner.style.display = 'block';
            alarmText.textContent = nextState.activeAlarms.join(' | ');
            const priority = App.alarms.getAlarmPriority(nextState.activeAlarms);
            alarmBanner.classList.toggle('advisory', priority === 'advisory');
            alarmBanner.classList.toggle('danger', priority !== 'advisory');
          }
        }
        if (trendStatus) {
          if (nextState.asystoleActive) {
            trendStatus.textContent = 'Asystole active';
          } else if (!nextState.trendRunning) {
            trendStatus.textContent = 'No active event';
          } else {
            const event = App.state.TREND_EVENTS[nextState.trendEvent];
            const elapsed = Math.max(0, Date.now() - nextState.trendStartedAt);
            const totalMs = nextState.trendDurationMs + nextState.trendHoldMs + (event?.returnToBaseline === false ? 0 : nextState.trendDurationMs);
            const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
            trendStatus.textContent = `${event?.label || 'Active event'} • ${App.state.getTrendProfileLabel(nextState.trendEvent)} • ${App.state.getTrendPhaseLabel(nextState.trendPhase)} • ${remaining}s remaining`;
          }
        }
      },
      setSyncStatus(status) {
        const element = document.getElementById('syncStatus');
        if (!element) {
          return;
        }
        element.textContent = status.message;
        element.classList.toggle('connected', Boolean(status.connected));
        element.classList.toggle('warning', !status.connected);
        element.classList.remove('danger', 'advisory');
      }
    };
  }

  App.controls = {
    mountControlPage
  };
})();

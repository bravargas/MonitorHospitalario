(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function mountControlPage() {
    const currentState = App.state.getState();
    const controlsRoot = document.getElementById('controls');
    const cache = {
      numeric: {},
      ranges: {}
    };

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
        const nibpStatusElement = document.getElementById('nibpStatus');
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
        if (trendStatus || nibpStatusElement) {
          const now = Date.now();
          const categoryDisplay = App.state.getPatientCategoryConfig(nextState).display;
          const nibpMeasureMs = Math.max(1, categoryDisplay.nibpMeasureMs || 0);
          const nibpStatus = nextState.nibpMeasurementActive
            ? `NIBP measuring (${Math.max(0, Math.ceil((nibpMeasureMs - (now - nextState.nibpMeasurementStartedAt)) / 1000))}s)`
            : categoryDisplay.nibpIntervalMs > 0
              ? `Next auto NIBP in ${Math.max(0, Math.ceil((nextState.nibpNextMeasurementAt - now) / 1000))}s`
              : 'NIBP manual';

          if (nibpStatusElement) {
            nibpStatusElement.textContent = nibpStatus;
          }

          if (nextState.asystoleActive) {
            if (trendStatus) {
              trendStatus.textContent = 'Asystole active';
            }
          } else if (!nextState.trendRunning) {
            if (trendStatus) {
              trendStatus.textContent = 'No active event';
            }
          } else {
            const event = App.state.TREND_EVENTS[nextState.trendEvent];
            const elapsed = Math.max(0, now - nextState.trendStartedAt);
            const totalMs = nextState.trendDurationMs + nextState.trendHoldMs + (event?.returnToBaseline === false ? 0 : nextState.trendDurationMs);
            const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
            if (trendStatus) {
              trendStatus.textContent = `${event?.label || 'Active event'} • ${App.state.getTrendProfileLabel(nextState.trendEvent)} • ${App.state.getTrendPhaseLabel(nextState.trendPhase)} • ${remaining}s remaining`;
            }
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

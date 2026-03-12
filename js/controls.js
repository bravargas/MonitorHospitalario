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
          if (cache.numeric[cfg.key]) cache.numeric[cfg.key].value = nextState[cfg.key];
          if (cache.ranges[cfg.key]) cache.ranges[cfg.key].value = nextState[cfg.key];
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

        if (document.getElementById('mHr')) document.getElementById('mHr').textContent = nextState.hr;
        if (document.getElementById('mSpO2')) document.getElementById('mSpO2').textContent = nextState.spo2;
        if (document.getElementById('mResp')) document.getElementById('mResp').textContent = nextState.resp;
        if (document.getElementById('mBP')) document.getElementById('mBP').textContent = `${nextState.sys}/${nextState.dia}`;

        const alarmBanner = document.getElementById('alarmBanner');
        const alarmText = document.getElementById('alarmText');
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

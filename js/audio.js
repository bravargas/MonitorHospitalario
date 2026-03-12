(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function createAudioManager({ enabled = true } = {}) {
    let audioCtx = null;
    let alarmPriority = 'none';
    let alarmPatternStep = 0;
    let nextAlarmToneAt = 0;

    const ALARM_PATTERNS = {
      critical: {
        cycle: 980,
        steps: [
          { offset: 0, frequency: 980, duration: 0.09, volume: 0.085, type: 'square' },
          { offset: 170, frequency: 880, duration: 0.09, volume: 0.08, type: 'square' },
          { offset: 340, frequency: 980, duration: 0.09, volume: 0.085, type: 'square' },
          { offset: 510, frequency: 880, duration: 0.09, volume: 0.08, type: 'square' }
        ]
      },
      warning: {
        cycle: 1850,
        steps: [
          { offset: 0, frequency: 740, duration: 0.08, volume: 0.06, type: 'triangle' },
          { offset: 210, frequency: 660, duration: 0.08, volume: 0.055, type: 'triangle' },
          { offset: 420, frequency: 740, duration: 0.08, volume: 0.06, type: 'triangle' }
        ]
      },
      advisory: {
        cycle: 2400,
        steps: [
          { offset: 0, frequency: 520, duration: 0.1, volume: 0.04, type: 'sine' }
        ]
      }
    };

    function playTone(frequency, duration, volumeScale, type = 'square') {
      const currentState = App.state.getState();
      const ctx = ensureContext();
      if (!ctx || !currentState.soundEnabled) {
        return false;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, currentState.alarmVolume * volumeScale), ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
      return true;
    }

    function ensureContext() {
      const currentState = App.state.getState();
      if (!enabled || !currentState.soundEnabled) {
        return null;
      }

      if (!audioCtx) {
        const AudioContextRef = window.AudioContext || window.webkitAudioContext;
        if (AudioContextRef) {
          audioCtx = new AudioContextRef();
        }
      }

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      currentState.audioUnlocked = Boolean(audioCtx);
      return audioCtx;
    }

    function unlock() {
      ensureContext();
    }

    function heartBeatTone() {
      playTone(1320, 0.03, 0.032, 'triangle');
      playTone(980, 0.05, 0.022, 'sine');
    }

    function resetAlarmPattern(now) {
      alarmPatternStep = 0;
      nextAlarmToneAt = now;
    }

    function processAlarmPattern(now, priority) {
      const pattern = ALARM_PATTERNS[priority];
      if (!pattern) {
        alarmPriority = 'none';
        alarmPatternStep = 0;
        nextAlarmToneAt = 0;
        return;
      }

      if (alarmPriority !== priority) {
        alarmPriority = priority;
        resetAlarmPattern(now);
      }

      while (now >= nextAlarmToneAt) {
        const step = pattern.steps[alarmPatternStep];
        playTone(step.frequency, step.duration, step.volume, step.type);

        alarmPatternStep += 1;
        if (alarmPatternStep >= pattern.steps.length) {
          alarmPatternStep = 0;
          nextAlarmToneAt += pattern.cycle - step.offset;
        } else {
          nextAlarmToneAt += pattern.steps[alarmPatternStep].offset - step.offset;
        }
      }
    }

    function process(now) {
      const currentState = App.state.getState();
      if (!enabled || !currentState.running) {
        return;
      }

      const beatInterval = 60000 / Math.max(20, currentState.hr);
      if (now - currentState.lastHeartBeatAt >= beatInterval) {
        heartBeatTone();
        currentState.lastHeartBeatAt = now;
      }

      if (!currentState.alarmsEnabled || currentState.activeAlarms.length === 0) {
        alarmPriority = 'none';
        alarmPatternStep = 0;
        nextAlarmToneAt = 0;
        return;
      }

      const priority = App.alarms.getAlarmPriority(currentState.activeAlarms);
      processAlarmPattern(now, priority);
      currentState.lastAlarmBeep = now;
    }

    ['click', 'keydown', 'touchstart'].forEach(eventName => {
      window.addEventListener(eventName, unlock, { once: true });
    });

    return {
      process,
      unlock
    };
  }

  App.audio = {
    createAudioManager
  };
})();

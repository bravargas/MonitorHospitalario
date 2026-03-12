(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function createAudioManager({ enabled = true } = {}) {
    let audioCtx = null;

    function playTone(frequency, duration, volumeScale) {
      const currentState = App.state.getState();
      const ctx = ensureContext();
      if (!ctx || !currentState.soundEnabled) {
        return false;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
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

    function beep(frequency = 880, duration = 0.12) {
      const currentState = App.state.getState();
      if (!currentState.alarmsEnabled || currentState.activeAlarms.length === 0) {
        return;
      }

      playTone(frequency, duration, 0.06);
    }

    function heartBeatTone() {
      playTone(1320, 0.045, 0.04);
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
        return;
      }

      const critical = App.alarms.isCriticalAlarm(currentState.activeAlarms);
      const interval = critical ? 700 : 1200;
      if (now - currentState.lastAlarmBeep >= interval) {
        beep(critical ? 740 : 880);
        currentState.lastAlarmBeep = now;
      }
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

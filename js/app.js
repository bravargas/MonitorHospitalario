(() => {
  const App = window.MonitorApp;
  const pageType = document.body.dataset.page || 'monitor';
  let controlsUi = null;
  let renderer = null;
  let audioManager = null;
  let syncManager = null;
  let previousChannel2Type = App.state.getState().channel2Type;

  function updateMonitorStatus(message, variant = 'warning') {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
      syncStatus.textContent = message;
      syncStatus.classList.remove('connected', 'warning', 'danger', 'ok');
      syncStatus.classList.add(variant);
    }
  }

  function updateAlarmIndicator() {
    const indicator = document.getElementById('alarmIndicator');
    if (!indicator) {
      return;
    }

    const currentState = App.state.getState();
    indicator.classList.remove('connected', 'warning', 'danger', 'ok');
    if (currentState.activeAlarms.length === 0) {
      indicator.textContent = 'Sin alarmas';
      indicator.classList.add('ok');
      return;
    }

    indicator.textContent = currentState.activeAlarms[0];
    indicator.classList.add(App.alarms.isCriticalAlarm(currentState.activeAlarms) ? 'danger' : 'warning');
  }

  function refreshUi() {
    App.alarms.refreshDerivedState();
    controlsUi?.refresh();
    updateAlarmIndicator();
  }

  function toggleFullscreen() {
    const target = document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch(() => {});
      return;
    }
    document.exitFullscreen?.().catch(() => {});
  }

  function handleStateChange(_state, meta = {}) {
    const currentState = App.state.getState();
    if (renderer && previousChannel2Type !== currentState.channel2Type) {
      renderer.clearTrace('channel2');
    }

    previousChannel2Type = currentState.channel2Type;
    refreshUi();

    if (syncManager && pageType === 'control' && meta.source === 'local' && !meta.skipBroadcast) {
      syncManager.broadcastState();
    }
  }

  App.state.subscribe(handleStateChange);

  if (pageType === 'control') {
    controlsUi = App.controls.mountControlPage();
  }

  if (pageType === 'monitor') {
    const canvas = document.getElementById('monitor');
    if (canvas) {
      renderer = App.renderer.createRenderer(canvas);
      canvas.addEventListener('dblclick', toggleFullscreen);
    }
    audioManager = App.audio.createAudioManager({ enabled: true });
    updateMonitorStatus('Esperando control…', 'warning');
  }

  syncManager = App.sync.createSync({
    pageType,
    onStateReceived(payload) {
      App.state.replaceState(payload, { source: 'remote', skipBroadcast: true });
    },
    onStatusChange(status) {
      if (controlsUi) {
        controlsUi.setSyncStatus(status);
      }
      if (pageType === 'monitor') {
        updateMonitorStatus(status.message, status.connected ? 'connected' : 'warning');
      }
    }
  });

  refreshUi();

  if (pageType === 'control') {
    syncManager.broadcastState('full');
  }

  if (pageType === 'monitor') {
    let last = performance.now();
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      audioManager?.process(now);
      renderer?.renderFrame(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  window.addEventListener('beforeunload', () => {
    syncManager?.dispose();
  });
})();

(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function evaluateAlarms(currentState) {
    if (!currentState.alarmsEnabled) {
      return [];
    }

    const alarms = [];
    if (currentState.spo2 < 90) alarms.push(`SpO2 baja (${currentState.spo2}%)`);
    if (currentState.hr > 130) alarms.push(`Taquicardia (${currentState.hr} bpm)`);
    if (currentState.hr < 45) alarms.push(`Bradicardia (${currentState.hr} bpm)`);
    if (currentState.resp > 28) alarms.push(`Taquipnea (${currentState.resp} rpm)`);
    if (currentState.resp < 8) alarms.push(`Bradipnea (${currentState.resp} rpm)`);
    if (currentState.sys < 90) alarms.push(`Hipotensión (${currentState.sys}/${currentState.dia})`);
    if (currentState.co2 > 50) alarms.push(`ETCO2 alto (${currentState.co2} mmHg)`);
    if (currentState.co2 < 25 && currentState.resp > 20) alarms.push(`ETCO2 bajo (${currentState.co2} mmHg)`);
    if (currentState.temp >= 39) alarms.push(`Temperatura alta (${currentState.temp.toFixed(1)} °C)`);
    if (currentState.channel2Type === 'cvp' && currentState.cvp > 15) alarms.push(`CVP alta (${currentState.cvp} mmHg)`);
    if (currentState.channel2Type === 'icp' && currentState.cvp + 2 > 20) {
      alarms.push(`ICP alta (${App.state.clamp(Math.round(currentState.cvp + 2), 0, 40)} mmHg)`);
    }

    return alarms;
  }

  function isCriticalAlarm(alarms) {
    return alarms.some(alarm => alarm.includes('SpO2 baja') || alarm.includes('Hipotensión'));
  }

  function refreshDerivedState() {
    const currentState = App.state.getState();
    currentState.activeAlarms = evaluateAlarms(currentState);
    return currentState.activeAlarms;
  }

  App.alarms = {
    evaluateAlarms,
    isCriticalAlarm,
    refreshDerivedState
  };
})();

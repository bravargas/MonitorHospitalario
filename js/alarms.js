(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function evaluateAlarms(currentState) {
    if (!currentState.alarmsEnabled) {
      return [];
    }

    const alarms = [];
    const limits = App.state.getPatientCategoryConfig(currentState).limits;
    if (currentState.asystoleActive) alarms.push('Asystole');
    if (currentState.ecgLeadsOff) alarms.push('ECG leads off');
    if (currentState.spo2ProbeOff) alarms.push('SpO2 sensor disconnected');
    if (currentState.tempProbeOff) alarms.push('TEMP probe disconnected');
    if (currentState.spo2 < limits.spo2Low) alarms.push(`Low SpO2 (${currentState.spo2}%)`);
    if (currentState.hr > limits.hrHigh) alarms.push(`Tachycardia (${currentState.hr} bpm)`);
    if (currentState.hr < limits.hrLow) alarms.push(`Bradycardia (${currentState.hr} bpm)`);
    if (currentState.resp > limits.respHigh) alarms.push(`Tachypnea (${currentState.resp} rpm)`);
    if (currentState.resp < limits.respLow) alarms.push(`Bradypnea (${currentState.resp} rpm)`);
    if (currentState.sys < limits.sysLow) alarms.push(`Hypotension (${currentState.sys}/${currentState.dia})`);
    if (currentState.co2 > limits.co2High) alarms.push(`High ETCO2 (${currentState.co2} mmHg)`);
    if (currentState.co2 < limits.co2Low && currentState.resp > limits.co2LowRespGate) alarms.push(`Low ETCO2 (${currentState.co2} mmHg)`);
    if (currentState.temp >= limits.tempHigh) alarms.push(`High temperature (${currentState.temp.toFixed(1)} °C)`);
    if (currentState.channel2Type === 'cvp' && currentState.cvp > limits.cvpHigh) alarms.push(`High CVP (${currentState.cvp} mmHg)`);
    if (currentState.channel2Type === 'icp' && currentState.cvp + 2 > limits.icpHigh) {
      alarms.push(`High ICP (${App.state.clamp(Math.round(currentState.cvp + 2), 0, 40)} mmHg)`);
    }

    return alarms;
  }

  function isCriticalAlarm(alarms) {
    return alarms.some(alarm => alarm.includes('Asystole') || alarm.includes('Low SpO2') || alarm.includes('Hypotension'));
  }

  function getAlarmPriority(alarms) {
    if (!alarms || alarms.length === 0) {
      return 'none';
    }
    if (isCriticalAlarm(alarms)) {
      return 'critical';
    }
    const hasPhysiologicAlarm = alarms.some(alarm => !alarm.includes('disconnected') && !alarm.includes('leads off'));
    return hasPhysiologicAlarm ? 'warning' : 'advisory';
  }

  function refreshDerivedState() {
    const currentState = App.state.getState();
    currentState.activeAlarms = evaluateAlarms(currentState);
    return currentState.activeAlarms;
  }

  App.alarms = {
    evaluateAlarms,
    getAlarmPriority,
    isCriticalAlarm,
    refreshDerivedState
  };
})();

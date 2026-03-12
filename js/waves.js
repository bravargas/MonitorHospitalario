(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function safePeriod(ratePerMinute, minRate = 1) {
    return 60 / Math.max(minRate, ratePerMinute || minRate);
  }

  function phase01(time, period) {
    const normalized = time / period;
    return normalized - Math.floor(normalized);
  }

  function gaussian(x, center, width, amplitude) {
    return Math.exp(-Math.pow(x - center, 2) / (2 * width * width)) * amplitude;
  }

  function sampleEcgLead(currentState, time, lead) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    const baseline = Math.sin(time * 1.7) * 0.01;
    const st = App.state.getStMeasurements(currentState);
    const leadShape = {
      ii: { stValue: st.ii, pAmp: 0.12, qAmp: 0.16, rAmp: 1.08, sAmp: 0.22, tAmp: 0.26, invert: 1 },
      i: { stValue: st.i, pAmp: 0.09, qAmp: 0.12, rAmp: 0.82, sAmp: 0.18, tAmp: 0.18, invert: 1 },
      v: { stValue: st.v, pAmp: 0.05, qAmp: 0.08, rAmp: 0.28, sAmp: 0.72, tAmp: 0.10, invert: 1 }
    }[lead] || { stValue: st.ii, pAmp: 0.12, qAmp: 0.16, rAmp: 1.08, sAmp: 0.22, tAmp: 0.26, invert: 1 };
    const stSegment = gaussian(p, 0.52, 0.038, leadShape.stValue * 0.18) + gaussian(p, 0.60, 0.050, leadShape.stValue * 0.13);
    const vTail = lead === 'v'
      ? -gaussian(p, 0.445, 0.016, 0.18) + gaussian(p, 0.70, 0.055, leadShape.stValue * 0.05)
      : 0;
    return baseline
      + gaussian(p, 0.18, 0.028, leadShape.pAmp * leadShape.invert)
      - gaussian(p, 0.39, 0.010, leadShape.qAmp * leadShape.invert)
      + gaussian(p, 0.405, 0.006, leadShape.rAmp * leadShape.invert)
      - gaussian(p, 0.43, 0.012, leadShape.sAmp * leadShape.invert)
      + stSegment
      + vTail
      + gaussian(p, 0.68, 0.060, leadShape.tAmp * leadShape.invert);
  }

  function sampleEcg(currentState, time) {
    return sampleEcgLead(currentState, time, 'ii');
  }

  function sampleResp(currentState, time) {
    const breathPeriod = safePeriod(currentState.resp, 4);
    const p = phase01(time, breathPeriod);
    return Math.sin(p * Math.PI * 2 - Math.PI / 2) * 0.72;
  }

  function samplePleth(currentState, time) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    const upstroke = Math.pow(Math.max(0, Math.sin(Math.PI * p)), 2.4);
    const notch = gaussian(p, 0.52, 0.040, 0.14);
    const runoff = gaussian(p, 0.68, 0.090, 0.24);
    return upstroke * 0.95 + notch + runoff - 0.08;
  }

  function sampleCo2(currentState, time) {
    const breathPeriod = safePeriod(currentState.resp, 4);
    const p = phase01(time, breathPeriod);
    if (p < 0.14) return -0.56;
    if (p < 0.24) return -0.56 + (p - 0.14) * 4.6;
    if (p < 0.62) return 0.08 + (1 - Math.exp(-(p - 0.24) * 8)) * 0.52;
    if (p < 0.78) return 0.56 - (p - 0.62) * 0.16;
    return 0.54 - (p - 0.78) * 5.0;
  }

  function sampleArt(currentState, time) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    const systolic = Math.pow(Math.max(0, Math.sin(Math.PI * p)), 2.0) * 0.86;
    const notch = gaussian(p, 0.34, 0.018, -0.08);
    const rebound = gaussian(p, 0.42, 0.025, 0.10);
    return systolic + notch + rebound - 0.16;
  }

  function sampleCvp(currentState, time) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    return gaussian(p, 0.16, 0.028, 0.12)
      + gaussian(p, 0.32, 0.020, 0.08)
      + gaussian(p, 0.55, 0.060, 0.10)
      - 0.09;
  }

  function samplePap(currentState, time) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    const main = Math.pow(Math.max(0, Math.sin(Math.PI * p)), 1.8) * 0.56;
    const notch = gaussian(p, 0.38, 0.022, -0.04);
    const rebound = gaussian(p, 0.48, 0.03, 0.07);
    return main + notch + rebound - 0.13;
  }

  function sampleIcp(currentState, time) {
    const beatPeriod = safePeriod(currentState.hr, 20);
    const p = phase01(time, beatPeriod);
    return gaussian(p, 0.20, 0.045, 0.10)
      + gaussian(p, 0.32, 0.045, 0.15)
      + gaussian(p, 0.44, 0.055, 0.08)
      - 0.08;
  }

  function sampleFlat() {
    return -0.02;
  }

  function sample(type, currentState, time) {
    if ((type === 'ecg' || type === 'ecg-i' || type === 'ecg-ii' || type === 'ecg-v') && currentState.ecgLeadsOff) return sampleFlat();
    if (type === 'pleth' && currentState.spo2ProbeOff) return sampleFlat();
    if (type === 'ecg') return sampleEcg(currentState, time);
    if (type === 'ecg-i') return sampleEcgLead(currentState, time, 'i');
    if (type === 'ecg-ii') return sampleEcgLead(currentState, time, 'ii');
    if (type === 'ecg-v') return sampleEcgLead(currentState, time, 'v');
    if (type === 'resp') return sampleResp(currentState, time);
    if (type === 'pleth') return samplePleth(currentState, time);
    if (type === 'co2') return sampleCo2(currentState, time);
    if (type === 'art') return sampleArt(currentState, time);
    if (type === 'cvp') return sampleCvp(currentState, time);
    if (type === 'pap') return samplePap(currentState, time);
    if (type === 'icp') return sampleIcp(currentState, time);
    return sampleFlat();
  }

  function getChannel2Wave(currentState) {
    if (currentState.channel2Type === 'off') return 'flat';
    if (currentState.channel2Type === 'pap') return 'pap';
    if (currentState.channel2Type === 'icp') return 'icp';
    if (currentState.channel2Type === 'art2') return 'art';
    return 'cvp';
  }

  function getChannel2Amplitude(currentState) {
    if (currentState.channel2Type === 'pap') return 22;
    if (currentState.channel2Type === 'art2') return 26;
    if (currentState.channel2Type === 'icp') return 14;
    if (currentState.channel2Type === 'off') return 3;
    return 26;
  }

  App.waves = {
    getChannel2Amplitude,
    getChannel2Wave,
    sample
  };
})();

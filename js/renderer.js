(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});
  const NIBP_INFLATION_FALLBACK_MS = 9000;
  const NIBP_MEASURING_PHASE_MS = 5000;

  function createBuffer(length) {
    const values = new Float32Array(length);
    values.fill(Number.NaN);
    return values;
  }

  function smoothNoise(time, column, amount) {
    if (!amount) {
      return 0;
    }
    return (Math.sin(time * 17 + column * 0.09) + Math.sin(time * 31 - column * 0.05)) * 0.25 * amount;
  }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const PANEL_W = 300;
    const GRID_W = W - PANEL_W;
    const ROWS = 6;
    const HEADER_H = 36;
    const GRID_H = H - HEADER_H;
    const ROW_H = GRID_H / ROWS;
    const SWEEP_DURATION = 6;
    const ERASE_WIDTH = 18;

    const traceDefs = [
      { key: 'ecgLeadII', wave: 'ecg-ii', color: '#00ff33', yBase: HEADER_H + ROW_H * 0.58, amplitude: currentState => 38 * currentState.ecgGain, noise: 0 },
      { key: 'ecgLeadI', wave: 'ecg-i', color: '#00ff33', yBase: HEADER_H + ROW_H * 1.58, amplitude: currentState => 34 * currentState.ecgGain, noise: 0 },
      { key: 'ecgLeadV', wave: 'ecg-v', color: '#00ff33', yBase: HEADER_H + ROW_H * 2.58, amplitude: currentState => 32 * currentState.ecgGain, noise: 0 },
      { key: 'pleth', wave: 'pleth', color: '#00e5ff', yBase: HEADER_H + ROW_H * 3.58, amplitude: 46, noise: 0.01 },
      { key: 'co2', wave: 'co2', color: '#ff63ff', yBase: HEADER_H + ROW_H * 4.58, amplitude: 30, noise: 0.004 },
      {
        key: 'channel2',
        wave: currentState => App.waves.getChannel2Wave(currentState),
        color: '#ff4d00',
        yBase: HEADER_H + ROW_H * 5.42,
        amplitude: currentState => App.waves.getChannel2Amplitude(currentState),
        noise: 0.006
      }
    ];

    const buffers = Object.fromEntries(traceDefs.map(def => [def.key, createBuffer(GRID_W)]));
    const deviceStatus = {
      batteryLevel: 100,
      charging: true,
      networkOnline: navigator.onLine !== false
    };
    let sweepX = 0;
    let signalTime = 0;

    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          deviceStatus.batteryLevel = Math.round((battery.level || 1) * 100);
          deviceStatus.charging = Boolean(battery.charging);
        };
        updateBattery();
        battery.addEventListener?.('levelchange', updateBattery);
        battery.addEventListener?.('chargingchange', updateBattery);
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        deviceStatus.networkOnline = true;
      });
      window.addEventListener('offline', () => {
        deviceStatus.networkOnline = false;
      });
    }

    function clearTrace(key) {
      if (!buffers[key]) {
        return;
      }
      buffers[key].fill(Number.NaN);
    }

    function resetAll() {
      Object.values(buffers).forEach(buffer => buffer.fill(Number.NaN));
      sweepX = 0;
      signalTime = 0;
    }

    function advanceBuffers(dt) {
      const currentState = App.state.getState();
      const columnSpeed = (GRID_W / SWEEP_DURATION) * (currentState.ecgSweepSpeed / 25);
      if (!currentState.running) {
        return;
      }

      const previousSweepX = sweepX;
      signalTime += dt;
      sweepX = (sweepX + columnSpeed * dt) % GRID_W;

      let columnsAdvanced = Math.floor(sweepX) - Math.floor(previousSweepX);
      if (sweepX < previousSweepX) {
        columnsAdvanced += GRID_W;
      }
      columnsAdvanced = Math.max(0, Math.min(GRID_W, columnsAdvanced));
      if (columnsAdvanced === 0) {
        return;
      }

      for (let step = 1; step <= columnsAdvanced; step += 1) {
        const column = (Math.floor(previousSweepX) + step) % GRID_W;
        const sampleTime = signalTime - dt + (dt * step) / columnsAdvanced;

        traceDefs.forEach(def => {
          const waveType = typeof def.wave === 'function' ? def.wave(currentState) : def.wave;
          const value = App.waves.sample(waveType, currentState, sampleTime) + smoothNoise(sampleTime, column, def.noise);
          buffers[def.key][column] = value;
        });

        for (let offset = 1; offset <= ERASE_WIDTH; offset += 1) {
          const clearColumn = (column + offset) % GRID_W;
          traceDefs.forEach(def => {
            buffers[def.key][clearColumn] = Number.NaN;
          });
        }
      }
    }

    function drawGrid() {
      ctx.save();
      ctx.strokeStyle = 'rgba(14,165,233,0.18)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 18; i += 1) {
        const x = (GRID_W / 18) * i;
        ctx.beginPath();
        ctx.moveTo(x, HEADER_H);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let i = 0; i <= 24; i += 1) {
        const y = HEADER_H + (GRID_H / 24) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GRID_W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawHeaderBand() {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.fillRect(0, 0, GRID_W, HEADER_H);
      ctx.strokeStyle = 'rgba(20, 55, 168, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, HEADER_H + 0.5);
      ctx.lineTo(GRID_W, HEADER_H + 0.5);
      ctx.stroke();
      ctx.restore();
    }

    function drawText(text, x, y, color, size = 18, align = 'left') {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `700 ${size}px Consolas, Monaco, monospace`;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function measureTextWidth(text, size = 18) {
      ctx.save();
      ctx.font = `700 ${size}px Consolas, Monaco, monospace`;
      const width = ctx.measureText(text).width;
      ctx.restore();
      return width;
    }

    function drawLabel(text, x, y, color, size = 18) {
      ctx.save();
      ctx.font = `700 ${size}px Consolas, Monaco, monospace`;
      const metrics = ctx.measureText(text);
      const width = Math.ceil(metrics.width) + 12;
      const height = size + 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.fillRect(x - 6, y - size + 2, width, height);
      ctx.restore();
      drawText(text, x, y, color, size);
    }

    function drawHeartIcon(x, y, size, pulse) {
      const baseScale = size / 16;
      const scale = baseScale * (0.9 + pulse * 0.18);
      const glow = 0.24 + pulse * 0.5;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.shadowColor = `rgba(255, 48, 72, ${glow})`;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff3048';
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-18, -10, -36, 8, 0, 34);
      ctx.bezierCurveTo(36, 8, 18, -10, 0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function traceRoundedRect(x, y, width, height, radius) {
      const corner = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + corner, y);
      ctx.lineTo(x + width - corner, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + corner);
      ctx.lineTo(x + width, y + height - corner);
      ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
      ctx.lineTo(x + corner, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - corner);
      ctx.lineTo(x, y + corner);
      ctx.quadraticCurveTo(x, y, x + corner, y);
      ctx.closePath();
    }

    function drawBatteryIcon(x, y, width, height, level, charging) {
      const normalized = Math.max(0, Math.min(100, level)) / 100;
      ctx.save();
      ctx.strokeStyle = charging ? '#8cff8c' : '#d0d7e2';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);
      ctx.strokeRect(x + width, y + height * 0.28, 3, height * 0.44);
      ctx.fillStyle = normalized > 0.25 ? (charging ? '#8cff8c' : '#d0d7e2') : '#ff5252';
      ctx.fillRect(x + 2, y + 2, Math.max(2, (width - 4) * normalized), height - 4);
      ctx.restore();
    }

    function drawNetworkIcon(x, y, online) {
      ctx.save();
      for (let index = 0; index < 4; index += 1) {
        const height = 3 + index * 2;
        ctx.fillStyle = online || index === 0 ? '#73e0ff' : 'rgba(115, 224, 255, 0.18)';
        ctx.fillRect(x + index * 4, y + 10 - height, 3, height);
      }
      if (!online) {
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - 1, y + 11);
        ctx.lineTo(x + 16, y - 1);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawStatusBadge(text, x, y, active, color) {
      const badgeColor = active ? color : 'rgba(208, 215, 226, 0.38)';
      ctx.save();
      ctx.font = '700 10px Consolas, Monaco, monospace';
      const width = Math.ceil(ctx.measureText(text).width) + 12;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(x, y - 9, width, 12);
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y - 8.5, width - 1, 11);
      ctx.fillStyle = badgeColor;
      ctx.fillText(text, x + 6, y);
      ctx.restore();
      return width;
    }

    function drawMonitorHeader(currentState) {
      const now = new Date();
      const hasPatientName = Boolean(currentState.patientName);
      const patientName = hasPatientName ? currentState.patientName : 'No name';
      const category = App.state.getPatientCategoryConfig(currentState);
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const speedLabel = `${currentState.ecgSweepSpeed} mm/s`;
      const batteryLabel = `${deviceStatus.batteryLevel}%`;
      let badgeX = 108;
      let rightX = GRID_W - 12;

      drawText('BrainMed', 18, 18, '#8cff8c', 14);
      drawText(`x${currentState.ecgGain}`, 108, 18, '#8cff8c', 14);
      drawText('MON', 152, 18, '#8cff8c', 14);
      drawText(patientName, 218, 18, hasPatientName ? '#73e0ff' : 'rgba(115, 224, 255, 0.42)', 14);

      drawText(batteryLabel, rightX, 18, '#d0d7e2', 11, 'right');
      drawBatteryIcon(rightX - measureTextWidth(batteryLabel, 11) - 24, 8, 18, 10, deviceStatus.batteryLevel, deviceStatus.charging);
      rightX -= measureTextWidth(batteryLabel, 11) + 44;

      drawText(stamp, rightX, 18, '#f5f5f5', 12, 'right');
      rightX -= measureTextWidth(stamp, 12) + 20;

      drawText(speedLabel, rightX, 18, '#f5f5f5', 14, 'right');
      rightX -= measureTextWidth(speedLabel, 14) + 22;

      drawText(category.headerLabel, rightX, 18, '#df84ff', 14, 'right');

      badgeX += drawStatusBadge(deviceStatus.networkOnline ? 'NET' : 'OFFLINE', badgeX, 32, deviceStatus.networkOnline, '#73e0ff') + 6;
      badgeX += drawStatusBadge(currentState.ecgLeadsOff ? 'ECG OFF' : 'ECG OK', badgeX, 32, !currentState.ecgLeadsOff, '#6eff6e') + 6;
      badgeX += drawStatusBadge(currentState.spo2ProbeOff ? 'SpO2 OFF' : 'SpO2 OK', badgeX, 32, !currentState.spo2ProbeOff, '#00e5ff') + 6;
      drawStatusBadge(currentState.tempProbeOff ? 'TEMP OFF' : 'TEMP OK', badgeX, 32, !currentState.tempProbeOff, '#ffb000');
    }

    function drawRightEdgeReferences(currentState) {
      const limits = App.state.getPatientCategoryConfig(currentState).limits;
      const rightX = GRID_W - 8;
      drawText(String(limits.hrHigh), rightX, HEADER_H + 16, '#7cff7c', 13, 'right');
      drawText(String(limits.hrLow), rightX, HEADER_H + ROW_H - 8, '#7cff7c', 13, 'right');
      drawText(String(limits.spo2Low), rightX, HEADER_H + ROW_H * 3 + 16, '#00e5ff', 13, 'right');
      drawText(String(limits.spo2Critical), rightX, HEADER_H + ROW_H * 4 - 8, '#ff5252', 13, 'right');
    }

    function formatSigned(value) {
      const sign = value > 0 ? '+' : value < 0 ? '-' : '±';
      return `${sign}${Math.abs(value).toFixed(1)}`;
    }

    function drawSweepTrace(def, currentState) {
      const amplitude = typeof def.amplitude === 'function' ? def.amplitude(currentState) : def.amplitude;
      const buffer = buffers[def.key];
      let drawing = false;

      ctx.save();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < GRID_W; x += 1) {
        const value = buffer[x];
        if (!Number.isFinite(value)) {
          if (drawing) {
            ctx.stroke();
            ctx.beginPath();
            drawing = false;
          }
          continue;
        }

        const py = def.yBase - value * amplitude;
        if (!drawing) {
          ctx.moveTo(x, py);
          drawing = true;
        } else {
          ctx.lineTo(x, py);
        }
      }

      if (drawing) {
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawSweepHead() {
      ctx.save();
      const x = sweepX;
      const gradient = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(Math.max(0, x - 12), 0, 24, H);
      ctx.restore();
    }

    function drawPanel(currentState) {
      const channel2 = App.state.getChannel2Display(currentState);
      const st = App.state.getStMeasurements(currentState);
      const category = App.state.getPatientCategoryConfig(currentState);
      const display = category.display;
      const isNeonate = currentState.patientCategory === 'neonate';
      const tempValue = currentState.temp.toFixed(1);
      const tempProbe2 = Math.max(30, Number((currentState.temp - 0.4).toFixed(1)));
      const tempDelta = Math.abs(currentState.temp - tempProbe2).toFixed(1);
      const ecgValue = currentState.ecgLeadsOff ? '---' : (currentState.asystoleActive ? '0' : String(currentState.hr));
      const spo2Value = currentState.spo2ProbeOff ? '---' : String(currentState.spo2);
      const showTempOff = currentState.tempProbeOff;
      const diagnosticVisible = currentState.showDiagnostic;
      const nibpNow = Date.now();
      const nibpMeasuring = Boolean(currentState.nibpMeasurementActive);
      const nibpMeasureMs = Math.max(1, display.nibpMeasureMs || 1);
      const nibpElapsedMs = nibpMeasuring
        ? Math.max(0, nibpNow - currentState.nibpMeasurementStartedAt)
        : 0;
      const nibpProgress = nibpMeasuring
        ? Math.min(1, nibpElapsedMs / nibpMeasureMs)
        : 0;
      const nibpInflationWindowMs = Math.max(
        800,
        Number(App.audio?.getNibpInflationDurationMs?.()) || NIBP_INFLATION_FALLBACK_MS
      );
      const nibpInflatingProgress = nibpMeasuring
        ? Math.min(1, nibpElapsedMs / nibpInflationWindowMs)
        : 0;
      const nibpIsInflatingPhase = nibpMeasuring && nibpInflatingProgress < 1;
      const nibpMeasuringElapsedMs = nibpMeasuring
        ? Math.max(0, nibpElapsedMs - nibpInflationWindowMs)
        : 0;
      const nibpIsMeasuringPhase = nibpMeasuring && !nibpIsInflatingPhase && nibpMeasuringElapsedMs < NIBP_MEASURING_PHASE_MS;
      const nibpMeasuringElapsedSeconds = nibpIsMeasuringPhase
        ? nibpMeasuringElapsedMs / 1000
        : 0;
      const nibpSeconds = currentState.nibpNextMeasurementAt > nibpNow
        ? Math.ceil((currentState.nibpNextMeasurementAt - nibpNow) / 1000)
        : display.nibpIntervalMs > 0
          ? Math.ceil(display.nibpIntervalMs / 1000)
          : 0;
      const nibpModeText = nibpMeasuring
        ? nibpIsInflatingPhase
          ? `Inflating ${Math.round(nibpInflatingProgress * 100)}%`
          : nibpIsMeasuringPhase
            ? `Measuring ${nibpMeasuringElapsedSeconds.toFixed(1)}s`
            : 'Completing...'
        : display.nibpIntervalMs > 0
          ? `${display.nibpMode} • ${nibpSeconds}s`
          : display.nibpMode;
      const nibpStatusText = nibpMeasuring
        ? nibpModeText
        : display.nibpIntervalMs > 0
          ? `Next auto: ${nibpSeconds}s`
          : 'Manual mode';
      const nibpValueText = nibpMeasuring ? '---/---' : `${currentState.sys}/${currentState.dia}`;
      const nibpMapText = nibpMeasuring ? '(---)' : `(${App.state.mapPressureValue(currentState)})`;
      const heartAge = Math.max(0, performance.now() - currentState.lastHeartBeatAt);
      const heartPulse = heartAge <= 180 ? 1 - heartAge / 180 : 0;
      const respText = String(currentState.resp);
      ctx.save();
      ctx.font = `700 ${display.respValueSize}px Consolas, Monaco, monospace`;
      const respWidth = ctx.measureText(respText).width;
      ctx.restore();
      const respValueX = GRID_W + (isNeonate ? 54 : 62);
      const respUnitX = Math.min(GRID_W + 128, respValueX + respWidth + 10);
      ctx.fillStyle = '#05070b';
      ctx.fillRect(GRID_W, 0, PANEL_W, H);
      ctx.strokeStyle = '#1437a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(GRID_W, 0);
      ctx.lineTo(GRID_W, H);
      ctx.stroke();

      ctx.lineWidth = 1;
      [110, 180, 270, 360, 490].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(GRID_W, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(GRID_W + PANEL_W / 2, 110);
      ctx.lineTo(GRID_W + PANEL_W / 2, 180);
      ctx.stroke();

      drawText('ECG', GRID_W + 14, 28, '#6eff6e', 18);
      drawText('bpm', GRID_W + 14, 46, '#6eff6e', 18);
      if (!currentState.ecgLeadsOff) {
        drawHeartIcon(GRID_W + 274, 26, 8, heartPulse);
      }
      if (diagnosticVisible) {
        drawText(`ST(I)  ${formatSigned(st.i)}`, GRID_W + 14, 64, '#7cff7c', 14);
        drawText(`ST(II) ${formatSigned(st.ii)}`, GRID_W + 14, 80, '#7cff7c', 14);
        drawText(`ST(V)  ${formatSigned(st.v)}`, GRID_W + 14, 96, '#7cff7c', 14);
      }
      drawText(ecgValue, GRID_W + 252, diagnosticVisible ? 96 : 88, '#00ff33', currentState.ecgLeadsOff ? 72 : diagnosticVisible ? 84 : 96, 'right');

      drawText('RESP', GRID_W + 14, 134, '#ffee00', 18);
      drawText('rpm', GRID_W + 14, 152, '#ffee00', 18);
  drawText(respText, respValueX, 170, '#ffee00', display.respValueSize);

      drawText('TEMP', GRID_W + 166, 132, '#ffb000', 18);
      drawText('T1', GRID_W + 166, 150, '#ffb000', 14);
      const tempC = currentState.temp;
      const tempDisplay = currentState.tempUnit === 'fahrenheit' ? (tempC * 9/5 + 32).toFixed(1) : tempC.toFixed(1);
      const tempUnit = currentState.tempUnit === 'fahrenheit' ? '°F' : '°C';
      drawText(showTempOff ? '--' : tempDisplay, GRID_W + 245, 150, '#ffb000', 22, 'right');
      drawText(showTempOff ? '' : tempUnit, GRID_W + 284, 150, '#ffb000', 22, 'right');
      const tempProbe2C = Math.max(30, Number((currentState.temp - 0.4).toFixed(1)));
      const tempProbe2Display = currentState.tempUnit === 'fahrenheit' ? (tempProbe2C * 9/5 + 32).toFixed(1) : tempProbe2C.toFixed(1);
      drawText('T2', GRID_W + 166, 165, '#ffb000', 14);
      drawText(showTempOff ? '--' : tempProbe2Display, GRID_W + 245, 165, '#ffb000', 18, 'right');
      const tempDeltaDisplay = currentState.tempUnit === 'fahrenheit' ? Math.abs((tempC - tempProbe2C) * 9/5).toFixed(1) : Math.abs(currentState.temp - tempProbe2C).toFixed(1);
      drawText('TD', GRID_W + 166, 178, '#ffb000', 14);
      drawText(showTempOff ? '--' : tempDeltaDisplay, GRID_W + 245, 178, '#ffb000', 18, 'right');

      drawText('SpO2', GRID_W + 14, 206, '#00e5ff', 18);
      drawText(spo2Value, GRID_W + 70, 248, '#00e5ff', currentState.spo2ProbeOff ? 46 : 56);
      drawText('%', GRID_W + 284, 206, '#00e5ff', 18, 'right');
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = currentState.spo2ProbeOff
          ? 'rgba(0,229,255,0.15)'
          : i < Math.max(1, Math.round(currentState.spo2 / 17))
            ? '#00e5ff'
            : 'rgba(0,229,255,0.25)';
        ctx.fillRect(GRID_W + 268, 252 - i * 8, 16, 5);
      }

      drawText('CO2', GRID_W + 14, 296, '#ff63ff', 18);
  drawText(String(currentState.co2), GRID_W + 72, 338, '#ff63ff', isNeonate ? 50 : 56);
      drawText('mmHg', GRID_W + 212, 296, '#ff63ff', 18);

      drawText('IBP (1,2)', GRID_W + 14, 386, '#ff4d00', 18);
      drawText(`${currentState.sys}/${currentState.dia}`, GRID_W + 14, 432, '#ff4d00', 30);
      drawText(`(${App.state.mapPressureValue(currentState)})`, GRID_W + 210, 432, '#ff4d00', 28, 'right');
      drawText('mmHg', GRID_W + 212, 386, '#ff4d00', 18);
      drawText(channel2.line1, GRID_W + 14, 470, '#ff4d00', 30);
      drawText(channel2.line2, GRID_W + 210, 470, '#ff4d00', 28, 'right');
      if (channel2.unit) {
        drawText(channel2.unit, GRID_W + 212, 448, '#ff4d00', 18);
      }

      drawText(display.nibpLabel, GRID_W + 14, 512, '#f5f5f5', isNeonate ? 16 : 18);
      drawText('mmHg', GRID_W + 134, 512, '#bdbdbd', 14);
      
      // Temperature Probe Off badge - top-right corner of TEMP section
      if (currentState.tempProbeOff) {
        ctx.save();
        ctx.font = '700 10px Consolas, Monaco, monospace';
        const tbw = ctx.measureText('Probe Off').width + 12;
        const tbx = GRID_W + 284 - tbw;
        const tby = 128;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(tbx, tby - 9, tbw, 12);
        ctx.strokeStyle = '#ffee00';
        ctx.lineWidth = 1;
        ctx.strokeRect(tbx + 0.5, tby - 8.5, tbw - 1, 11);
        ctx.fillStyle = '#ffee00';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Probe Off', tbx + 6, tby);
        ctx.restore();
      }
      
      // NIBP mode badge - right-aligned with temperature symbol, badge style
      ctx.save();
      ctx.font = '700 10px Consolas, Monaco, monospace';
      const nibpIsAuto = display.nibpIntervalMs > 0;
      const nibpModeLabelText = nibpIsAuto ? 'AUTO' : 'MANUAL';
      const nibpBadgeColor = nibpIsAuto ? '#6eff6e' : '#ffee00';
      const nibpBw = ctx.measureText(nibpModeLabelText).width + 12;
      const nibpBx = GRID_W + 284 - nibpBw;
      const nibpBy = 512;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(nibpBx, nibpBy - 9, nibpBw, 12);
      ctx.strokeStyle = nibpBadgeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(nibpBx + 0.5, nibpBy - 8.5, nibpBw - 1, 11);
      ctx.fillStyle = nibpBadgeColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(nibpModeLabelText, nibpBx + 6, nibpBy);
      ctx.restore();
      
      drawText(nibpValueText, GRID_W + 14, 550, nibpMeasuring ? '#d0d7e2' : '#f5f5f5', display.nibpValueSize);
      drawText(nibpMapText, GRID_W + 210, 550, nibpMeasuring ? '#d0d7e2' : '#f5f5f5', display.nibpMapSize, 'right');
      drawText(nibpStatusText, GRID_W + 14, 570, nibpMeasuring ? '#ffee00' : '#8fdcff', isNeonate ? 14 : 16);
      if (nibpMeasuring) {
        ctx.save();
        ctx.strokeStyle = '#ffee00';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(GRID_W + 12.5, 578, 211, 13);
        ctx.fillStyle = 'rgba(255, 238, 0, 0.18)';
        ctx.fillRect(GRID_W + 14, 580.5, 208, 8);
        ctx.fillStyle = '#ffee00';
        ctx.fillRect(GRID_W + 14, 580.5, 208 * nibpInflatingProgress, 8);
        drawText('CUFF', GRID_W + 228, 591, '#ffee00', 10);
        ctx.restore();
      }
    }

    function drawProbeOffBadge(cx, yBase) {
      ctx.save();
      ctx.font = '700 10px Consolas, Monaco, monospace';
      const tw = ctx.measureText('Probe Off').width + 12;
      const bx = cx - tw / 2;
      const by = yBase + 3;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(bx, by - 9, tw, 12);
      ctx.strokeStyle = '#ffee00';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by - 8.5, tw - 1, 11);
      ctx.fillStyle = '#ffee00';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Probe Off', bx + 6, by);
      ctx.restore();
    }

    function drawLabels(currentState) {
      const channel2 = App.state.getChannel2Display(currentState);
      
      // Left-side trace labels
      if (currentState.ecgLeadsOff) {
        drawProbeOffBadge(GRID_W / 2, HEADER_H + ROW_H * 0.58);
        drawProbeOffBadge(GRID_W / 2, HEADER_H + ROW_H * 1.58);
        drawProbeOffBadge(GRID_W / 2, HEADER_H + ROW_H * 2.58);
      } else {
        drawLabel('II', 14, HEADER_H + 22, '#00ff33', 18);
      }
      
      if (currentState.showDiagnostic) {
        drawLabel('Diagnostic', 360, HEADER_H + 22, '#7cff7c', 17);
      }
      if (!currentState.ecgLeadsOff) {
        drawLabel('I', 14, HEADER_H + ROW_H + 22, '#00ff33', 18);
        drawLabel('V', 14, HEADER_H + ROW_H * 2 + 22, '#00ff33', 18);
      }
      
      if (currentState.spo2ProbeOff) {
        drawProbeOffBadge(GRID_W / 2, HEADER_H + ROW_H * 3.58);
      } else {
        drawLabel('Pleth', 14, HEADER_H + ROW_H * 3 + 22, '#00e5ff', 18);
      }
      
      drawLabel('CO2', 14, HEADER_H + ROW_H * 4 + 22, '#ff63ff', 18);
      drawLabel(channel2.label, 14, HEADER_H + ROW_H * 5 + 22, '#ff4d00', 18);
    }

    function renderFrame(dt) {
      advanceBuffers(dt);
      const currentState = App.state.getState();

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = currentState.activeAlarms.length ? '#120000' : '#000';
      ctx.fillRect(0, 0, W, H);

      if (currentState.showGrid) {
        drawGrid();
      }
      traceDefs.forEach(def => drawSweepTrace(def, currentState));
      drawSweepHead();
      drawHeaderBand();
      drawMonitorHeader(currentState);
      drawRightEdgeReferences(currentState);
      drawLabels(currentState);
      drawPanel(currentState);

      if (currentState.activeAlarms.length) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,60,60,0.85)';
        ctx.lineWidth = 4;
        traceRoundedRect(2, 2, W - 4, H - 4, 18);
        ctx.stroke();
        ctx.restore();
      }
    }

    return {
      clearTrace,
      renderFrame,
      resetAll
    };
  }

  App.renderer = {
    createRenderer
  };
})();

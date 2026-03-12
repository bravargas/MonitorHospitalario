(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

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
    const ROW_H = H / ROWS;
    const SWEEP_DURATION = 6;
    const ERASE_WIDTH = 18;
    const COLUMN_SPEED = GRID_W / SWEEP_DURATION;

    const traceDefs = [
      { key: 'ecg', wave: 'ecg', color: '#00ff33', yBase: ROW_H * 0.58, amplitude: 38, noise: 0 },
      { key: 'resp', wave: 'resp', color: '#ffee00', yBase: ROW_H * 1.58, amplitude: 28, noise: 0 },
      { key: 'pleth', wave: 'pleth', color: '#00e5ff', yBase: ROW_H * 2.58, amplitude: 46, noise: 0.01 },
      { key: 'co2', wave: 'co2', color: '#ff63ff', yBase: ROW_H * 3.58, amplitude: 30, noise: 0.004 },
      { key: 'art', wave: 'art', color: '#ff4d00', yBase: ROW_H * 4.58, amplitude: 26, noise: 0.006 },
      {
        key: 'channel2',
        wave: currentState => App.waves.getChannel2Wave(currentState),
        color: '#ff4d00',
        yBase: ROW_H * 5.58,
        amplitude: currentState => App.waves.getChannel2Amplitude(currentState),
        noise: 0.006
      }
    ];

    const buffers = Object.fromEntries(traceDefs.map(def => [def.key, createBuffer(GRID_W)]));
    let sweepX = 0;
    let signalTime = 0;

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
      if (!currentState.running) {
        return;
      }

      const previousSweepX = sweepX;
      signalTime += dt;
      sweepX = (sweepX + COLUMN_SPEED * dt) % GRID_W;

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
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let i = 0; i <= 24; i += 1) {
        const y = (H / 24) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GRID_W, y);
        ctx.stroke();
      }
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
      const gradient = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(Math.max(0, x - 18), 0, 36, H);
      ctx.restore();
    }

    function drawPanel(currentState) {
      const channel2 = App.state.getChannel2Display(currentState);
      const st = App.state.getStMeasurements(currentState);
      const tempValue = currentState.temp.toFixed(1);
      const tempProbe2 = Math.max(30, Number((currentState.temp - 0.4).toFixed(1)));
      const tempDelta = Math.abs(currentState.temp - tempProbe2).toFixed(1);
      const ecgValue = currentState.ecgLeadsOff ? '---' : String(currentState.hr);
      const spo2Value = currentState.spo2ProbeOff ? '---' : String(currentState.spo2);
      const showTempOff = currentState.tempProbeOff;
      const diagnosticVisible = currentState.showDiagnostic;
      const heartAge = Math.max(0, performance.now() - currentState.lastHeartBeatAt);
      const heartPulse = heartAge <= 180 ? 1 - heartAge / 180 : 0;
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
      drawText(String(currentState.resp), GRID_W + 90, 170, '#ffee00', 56);

      drawText('TEMP', GRID_W + 166, 132, '#ffb000', 18);
      drawText('T1', GRID_W + 166, 150, '#ffb000', 14);
      drawText(showTempOff ? '--' : tempValue, GRID_W + 258, 150, '#ffb000', 22, 'right');
      drawText(showTempOff ? '' : '°C', GRID_W + 284, 150, '#ffb000', 12, 'right');
      drawText('T2', GRID_W + 166, 166, '#ffb000', 14);
      drawText(showTempOff ? '--' : tempProbe2.toFixed(1), GRID_W + 258, 166, '#ffb000', 18, 'right');
      drawText('TD', GRID_W + 166, 178, '#ffb000', 14);
      drawText(showTempOff ? '--' : tempDelta, GRID_W + 258, 178, '#ffb000', 18, 'right');

      drawText('SpO2', GRID_W + 14, 206, '#00e5ff', 18);
      drawText(spo2Value, GRID_W + 90, 248, '#00e5ff', currentState.spo2ProbeOff ? 46 : 56);
      drawText('%', GRID_W + 258, 206, '#00e5ff', 18);
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = currentState.spo2ProbeOff
          ? 'rgba(0,229,255,0.15)'
          : i < Math.max(1, Math.round(currentState.spo2 / 17))
            ? '#00e5ff'
            : 'rgba(0,229,255,0.25)';
        ctx.fillRect(GRID_W + 250, 252 - i * 8, 16, 5);
      }

      drawText('CO2', GRID_W + 14, 296, '#ff63ff', 18);
      drawText(String(currentState.co2), GRID_W + 92, 338, '#ff63ff', 56);
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

      drawText('NIBP', GRID_W + 14, 520, '#f5f5f5', 18);
      drawText('mmHg', GRID_W + 212, 520, '#bdbdbd', 18);
      drawText(`${currentState.sys}/${currentState.dia}`, GRID_W + 14, 566, '#f5f5f5', 30);
      drawText(`(${App.state.mapPressureValue(currentState)})`, GRID_W + 210, 566, '#f5f5f5', 28, 'right');
      drawText('Manual', GRID_W + 14, 595, '#d0d7e2', 18);
    }

    function drawLabels(currentState) {
      const channel2 = App.state.getChannel2Display(currentState);
      drawLabel('II   XI', 14, 24, '#00ff33', 18);
      if (currentState.showDiagnostic) {
        drawLabel('Diagnostic', 150, 24, '#7cff7c', 18);
      }
      drawLabel('RESP', 14, ROW_H + 22, '#ffee00', 18);
      drawLabel('Pleth', 14, ROW_H * 2 + 16, '#00e5ff', 18);
      drawLabel('CO2', 14, ROW_H * 3 + 22, '#ff63ff', 18);
      drawLabel('CH1:Art', 14, ROW_H * 4 + 22, '#ff4d00', 18);
      drawLabel(channel2.label, 14, ROW_H * 5 + 22, '#ff4d00', 18);
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
      drawLabels(currentState);
      drawPanel(currentState);

      if (currentState.activeAlarms.length) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,60,60,0.85)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);
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

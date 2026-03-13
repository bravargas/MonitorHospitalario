(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  function createAudioManager({ enabled = true } = {}) {
    const REFERENCE_AUDIO_PATH = 'audio/Icu.mp3';
    const REFERENCE_AUDIO_BASE64 = App.audioAssets?.referenceMp3Base64 || null;
    const OUTPUT_GAIN_BOOST = 7.5;
    const ASYSTOLE_TONE_VOLUME_SCALE = 0.016;
    const ASYSTOLE_TONE_MAX_GAIN = 0.11;
    let audioCtx = null;
    let masterCompressor = null;
    let masterGainNode = null;
    let alarmPriority = 'none';
    let alarmPatternStep = 0;
    let nextAlarmToneAt = 0;
    let nextNibpPumpAt = 0;
    let asystoleToneOsc = null;
    let asystoleToneGain = null;
    let referenceBuffer = null;
    let referenceCue = { startSec: 0, durationSec: 0.09 };
    let referenceLoadPromise = null;
    let referenceAudioUnavailable = false;
    let nextReferenceRetryAt = 0;
    let referenceStatus = 'idle';
    let referenceElement = null;
    let referenceElementReady = false;

    // Pulse beep config is isolated so we can later enable SpO2 pitch mapping
    // without changing scheduler or monitor logic.
    const PULSE_TONE_CONFIG = {
      frequencyHz: 1687,
      durationSec: 0.09,
      attackSec: 0.004,
      releaseSec: 0.03,
      volumeScale: 0.07,
      type: 'sine',
      mapBySpo2: false,
      minHz: 1300,
      maxHz: 1900
    };

    const ALARM_PATTERNS = {
      // High-priority bedside alarm: sharp 3-pulse burst with short pause.
      critical: {
        cycle: 1040,
        steps: [
          { offset: 0, frequency: 1160, duration: 0.075, volume: 0.078, type: 'square' },
          { offset: 155, frequency: 980, duration: 0.075, volume: 0.074, type: 'square' },
          { offset: 310, frequency: 1160, duration: 0.075, volume: 0.078, type: 'square' }
        ]
      },
      // Medium-priority alarm: clear two-tone pair, less aggressive than critical.
      warning: {
        cycle: 1700,
        steps: [
          { offset: 0, frequency: 840, duration: 0.085, volume: 0.058, type: 'triangle' },
          { offset: 240, frequency: 720, duration: 0.085, volume: 0.054, type: 'triangle' }
        ]
      },
      // Low-priority advisory: single soft tone with longer repeat interval.
      advisory: {
        cycle: 2600,
        steps: [
          { offset: 0, frequency: 580, duration: 0.11, volume: 0.036, type: 'sine' }
        ]
      }
    };

    function detectReferenceCue(buffer) {
      const channelData = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      const windowSize = 256;
      const frameCount = Math.floor(channelData.length / windowSize);

      if (frameCount < 8) {
        return { startSec: 0, durationSec: Math.min(0.1, buffer.duration) };
      }

      let maxEnergy = 0;
      let peakFrame = 0;
      const energies = new Float32Array(frameCount);

      for (let frame = 0; frame < frameCount; frame += 1) {
        const base = frame * windowSize;
        let sum = 0;
        for (let i = 0; i < windowSize; i += 1) {
          const value = channelData[base + i] || 0;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / windowSize);
        energies[frame] = rms;
        if (rms > maxEnergy) {
          maxEnergy = rms;
          peakFrame = frame;
        }
      }

      if (maxEnergy <= 0) {
        return { startSec: 0, durationSec: Math.min(0.1, buffer.duration) };
      }

      let startFrame = peakFrame;
      const startThreshold = maxEnergy * 0.24;
      while (startFrame > 1 && energies[startFrame] > startThreshold) {
        startFrame -= 1;
      }

      let endFrame = peakFrame;
      const endThreshold = maxEnergy * 0.18;
      while (endFrame < frameCount - 2 && energies[endFrame] > endThreshold) {
        endFrame += 1;
      }

      const startSec = (startFrame * windowSize) / sampleRate;
      const naturalDuration = ((endFrame - startFrame) * windowSize) / sampleRate;
      const durationSec = Math.max(0.07, Math.min(0.12, naturalDuration || 0.09));

      return {
        startSec: Math.max(0, Math.min(startSec, Math.max(0, buffer.duration - 0.02))),
        durationSec: Math.max(0.03, Math.min(durationSec, Math.max(0.03, buffer.duration - startSec)))
      };
    }

    function getOutputGain(currentState, volumeScale, maxGain = 1.2) {
      const boosted = currentState.alarmVolume * volumeScale * OUTPUT_GAIN_BOOST;
      return Math.max(0.0001, Math.min(maxGain, boosted));
    }

    function decodeBase64ToArrayBuffer(base64) {
      const binary = window.atob(base64);
      const length = binary.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }

    function getOutputDestination(ctx) {
      if (!masterCompressor || !masterGainNode) {
        masterCompressor = ctx.createDynamicsCompressor();
        masterCompressor.threshold.setValueAtTime(-26, ctx.currentTime);
        masterCompressor.knee.setValueAtTime(14, ctx.currentTime);
        masterCompressor.ratio.setValueAtTime(4, ctx.currentTime);
        masterCompressor.attack.setValueAtTime(0.002, ctx.currentTime);
        masterCompressor.release.setValueAtTime(0.12, ctx.currentTime);

        masterGainNode = ctx.createGain();
        masterGainNode.gain.setValueAtTime(1.9, ctx.currentTime);

        masterCompressor.connect(masterGainNode);
        masterGainNode.connect(ctx.destination);
      }

      return masterCompressor;
    }

    function ensureReferenceLoaded() {
      if (referenceAudioUnavailable && Date.now() < nextReferenceRetryAt) {
        referenceStatus = 'failed';
        return null;
      }

      const ctx = ensureContext();
      if (!ctx || referenceBuffer || referenceLoadPromise || referenceAudioUnavailable) {
        if (referenceBuffer) {
          referenceStatus = 'loaded';
        } else if (referenceLoadPromise) {
          referenceStatus = 'loading';
        }

        if (referenceAudioUnavailable && Date.now() >= nextReferenceRetryAt) {
          referenceAudioUnavailable = false;
        }
        return referenceLoadPromise;
      }

      if (REFERENCE_AUDIO_BASE64) {
        referenceStatus = 'loading';
        referenceLoadPromise = ctx.decodeAudioData(decodeBase64ToArrayBuffer(REFERENCE_AUDIO_BASE64))
          .then(decodedBuffer => {
            referenceBuffer = decodedBuffer;
            referenceCue = detectReferenceCue(decodedBuffer);
            referenceAudioUnavailable = false;
            nextReferenceRetryAt = 0;
            referenceStatus = 'loaded';
          })
          .catch(() => {
            referenceBuffer = null;
            referenceAudioUnavailable = true;
            nextReferenceRetryAt = Date.now() + 10000;
            referenceStatus = 'failed';
          })
          .finally(() => {
            referenceLoadPromise = null;
          });

        return referenceLoadPromise;
      }

      // When opened as file:// and no embedded asset is available, use media element fallback.
      if (window.location.protocol === 'file:') {
        ensureReferenceElementLoaded();
        return null;
      }

      referenceStatus = 'loading';
      referenceLoadPromise = fetch(REFERENCE_AUDIO_PATH, { cache: 'no-store' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer.slice(0)))
        .then(decodedBuffer => {
          referenceBuffer = decodedBuffer;
          referenceCue = detectReferenceCue(decodedBuffer);
          referenceAudioUnavailable = false;
          nextReferenceRetryAt = 0;
          referenceStatus = 'loaded';
        })
        .catch(() => {
          referenceBuffer = null;
          referenceAudioUnavailable = true;
          nextReferenceRetryAt = Date.now() + 10000;
          referenceStatus = 'failed';
        })
        .finally(() => {
          referenceLoadPromise = null;
        });

      return referenceLoadPromise;
    }

    function ensureReferenceElementLoaded() {
      if (referenceElement) {
        referenceStatus = referenceElementReady ? 'loaded' : 'loading';
        return;
      }

      referenceStatus = 'loading';
      referenceElement = new Audio(REFERENCE_AUDIO_PATH);
      referenceElement.preload = 'auto';

      referenceElement.addEventListener(
        'canplaythrough',
        () => {
          referenceElementReady = true;
          referenceStatus = 'loaded';
        },
        { once: true }
      );

      referenceElement.addEventListener(
        'loadedmetadata',
        () => {
          referenceElementReady = true;
          referenceStatus = 'loaded';
          if (Number.isFinite(referenceElement.duration) && referenceElement.duration > 0) {
            referenceCue.durationSec = Math.max(0.05, Math.min(0.12, referenceElement.duration));
          }
        },
        { once: true }
      );

      referenceElement.addEventListener('error', () => {
        referenceElementReady = false;
        referenceStatus = 'failed';
      });

      referenceElement.load();
    }

    function playReferenceElementTone({ frequency, duration, volumeScale }) {
      const currentState = App.state.getState();
      if (!referenceElementReady || !referenceElement) {
        return false;
      }

      const baseFrequency = PULSE_TONE_CONFIG.frequencyHz;
      const playbackRate = Math.max(0.45, Math.min(2.1, frequency / baseFrequency));
      const sampleDuration = Math.max(0.03, Math.min(duration, referenceCue.durationSec));
      const sampleStart = Math.max(0, referenceCue.startSec || 0);
      const clip = referenceElement.cloneNode();

      clip.preload = 'auto';
      clip.volume = Math.max(0, Math.min(1, getOutputGain(currentState, volumeScale, 1.6)));
      clip.playbackRate = playbackRate;
      clip.currentTime = sampleStart;

      clip.play().catch(() => {});
      window.setTimeout(() => {
        clip.pause();
        clip.removeAttribute('src');
        clip.load();
      }, Math.max(35, Math.round(sampleDuration * 1000) + 25));

      return true;
    }

    function playReferenceTone({ frequency, duration, volumeScale }) {
      const currentState = App.state.getState();
      const ctx = ensureContext();
      if (!ctx || !currentState.soundEnabled) {
        return false;
      }

      if (!referenceBuffer && playReferenceElementTone({ frequency, duration, volumeScale })) {
        return true;
      }

      if (!referenceBuffer) {
        return false;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const baseFrequency = PULSE_TONE_CONFIG.frequencyHz;
      const playbackRate = Math.max(0.45, Math.min(2.1, frequency / baseFrequency));
      const sampleDuration = Math.max(0.03, Math.min(duration, referenceCue.durationSec));
      const stopAt = ctx.currentTime + sampleDuration;
      const peak = getOutputGain(currentState, volumeScale, 1.2);
      const attack = Math.min(0.005, sampleDuration * 0.25);
      const release = Math.min(0.04, sampleDuration * 0.45);

      source.buffer = referenceBuffer;
      source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
      gain.gain.setValueAtTime(peak, Math.max(ctx.currentTime + attack, stopAt - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      source.connect(gain);
      gain.connect(getOutputDestination(ctx));
      source.start(ctx.currentTime, referenceCue.startSec, Math.min(sampleDuration, Math.max(0.02, referenceBuffer.duration - referenceCue.startSec)));
      source.stop(stopAt + 0.01);
      return true;
    }

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
      gain.gain.exponentialRampToValueAtTime(getOutputGain(currentState, volumeScale, 1.0), ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(getOutputDestination(ctx));
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
      return true;
    }

    function startAsystoleContinuousTone() {
      const currentState = App.state.getState();
      const ctx = ensureContext();
      if (!ctx || !currentState.soundEnabled || !currentState.alarmsEnabled || !currentState.asystoleActive) {
        return;
      }
      const peak = getOutputGain(currentState, ASYSTOLE_TONE_VOLUME_SCALE, ASYSTOLE_TONE_MAX_GAIN);
      if (asystoleToneOsc && asystoleToneGain) {
        // Keep continuous alarm synced to the live volume slider.
        asystoleToneGain.gain.setTargetAtTime(peak, ctx.currentTime, 0.04);
        return;
      }

      asystoleToneOsc = ctx.createOscillator();
      asystoleToneGain = ctx.createGain();

      asystoleToneOsc.type = 'sine';
      asystoleToneOsc.frequency.setValueAtTime(920, ctx.currentTime);

      asystoleToneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      asystoleToneGain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.03);

      asystoleToneOsc.connect(asystoleToneGain);
      asystoleToneGain.connect(getOutputDestination(ctx));
      asystoleToneOsc.start(ctx.currentTime);
    }

    function stopAsystoleContinuousTone() {
      if (!asystoleToneOsc || !asystoleToneGain || !audioCtx) {
        asystoleToneOsc = null;
        asystoleToneGain = null;
        return;
      }

      const now = audioCtx.currentTime;
      asystoleToneGain.gain.cancelScheduledValues(now);
      asystoleToneGain.gain.setValueAtTime(Math.max(0.0001, asystoleToneGain.gain.value || 0.0001), now);
      asystoleToneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      asystoleToneOsc.stop(now + 0.08);

      asystoleToneOsc = null;
      asystoleToneGain = null;
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
      ensureReferenceLoaded();
    }

    function getPulseFrequencyHz(currentState) {
      if (!PULSE_TONE_CONFIG.mapBySpo2) {
        return PULSE_TONE_CONFIG.frequencyHz;
      }

      const spo2 = Math.max(70, Math.min(100, Number(currentState.spo2) || 99));
      const ratio = (spo2 - 70) / 30;
      return PULSE_TONE_CONFIG.minHz + ratio * (PULSE_TONE_CONFIG.maxHz - PULSE_TONE_CONFIG.minHz);
    }

    function heartBeatTone() {
      const currentState = App.state.getState();
      const ctx = ensureContext();
      if (!ctx || !currentState.soundEnabled) {
        return false;
      }

      const frequency = getPulseFrequencyHz(currentState);
      if (playReferenceTone({ frequency, duration: PULSE_TONE_CONFIG.durationSec, volumeScale: PULSE_TONE_CONFIG.volumeScale })) {
        return true;
      }

      const attackEnd = ctx.currentTime + PULSE_TONE_CONFIG.attackSec;
      const releaseStart = ctx.currentTime + Math.max(PULSE_TONE_CONFIG.attackSec, PULSE_TONE_CONFIG.durationSec - PULSE_TONE_CONFIG.releaseSec);
      const stopAt = ctx.currentTime + PULSE_TONE_CONFIG.durationSec;
      const peak = getOutputGain(currentState, PULSE_TONE_CONFIG.volumeScale, 1.0);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = PULSE_TONE_CONFIG.type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Smooth envelope avoids clicks on repeated pulse playback.
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peak, attackEnd);
      gain.gain.setValueAtTime(peak, releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      osc.connect(gain);
      gain.connect(getOutputDestination(ctx));
      osc.start(ctx.currentTime);
      osc.stop(stopAt + 0.01);
      return true;
    }

    function nibpPumpTone() {
      // short mechanical thump: low sawtooth body + brief square click
      playTone(92, 0.058, 0.10, 'sawtooth');
      playTone(215, 0.025, 0.05, 'square');
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
        if (!playReferenceTone({ frequency: step.frequency, duration: step.duration, volumeScale: step.volume })) {
          playTone(step.frequency, step.duration, step.volume, step.type);
        }

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
        stopAsystoleContinuousTone();
        return;
      }

      ensureReferenceLoaded();

      if (!currentState.asystoleActive) {
        stopAsystoleContinuousTone();
        const beatInterval = 60000 / Math.max(20, currentState.hr);
        if (now - currentState.lastHeartBeatAt >= beatInterval) {
          heartBeatTone();
          currentState.lastHeartBeatAt = now;
        }
      } else {
        startAsystoleContinuousTone();
      }

      // NIBP cuff inflation pump sound
      if (currentState.nibpMeasurementActive) {
        if (now >= nextNibpPumpAt) {
          nibpPumpTone();
          nextNibpPumpAt = now + 780;
        }
      } else {
        nextNibpPumpAt = 0;
      }

      if (!currentState.alarmsEnabled || currentState.activeAlarms.length === 0) {
        stopAsystoleContinuousTone();
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
      unlock,
      getReferenceStatus() {
        return referenceStatus;
      }
    };
  }

  App.audio = {
    createAudioManager
  };
})();

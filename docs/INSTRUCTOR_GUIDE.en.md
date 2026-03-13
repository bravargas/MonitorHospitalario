# Instructor Guide (EN)

## 1. Purpose
This simulator supports multiparameter monitor interpretation training in teaching settings, while avoiding direct diagnostic hints on the student screen.

## 2. Recommended flow
1. Open `control.html` (instructor).
2. Open `monitor.html` (student).
3. Set baseline parameters using a clinical profile.
4. Trigger clinical events and assess student interpretation.
5. Use technical alarms to introduce artifacts and disconnections.

## 3. Teaching philosophy
- Students should interpret waveforms and numeric trends, not read explicit diagnoses.
- Student monitor only shows a generic alarm state (no alarm/event name).
- Instructor panel centralizes orchestration information.

## 4. Suggested scenarios
### Scenario A: Respiratory deterioration
1. Start from normal profile.
2. Trigger desaturation or apnea.
3. Teaching goal: identify hypoxemia, respiratory pattern changes, and hemodynamic trend impact.

### Scenario B: Hemodynamic compromise
1. Start from compensated sepsis or shock profile.
2. Adjust systolic/diastolic pressure and ETCO2.
3. Teaching goal: prioritize perfusion interpretation and shock recognition.

### Scenario C: Asystole
1. Press `Start asystole`.
2. Verify near-flat ECG line + active alarm.
3. Teaching goal: identify asystole from monitor data and initiate protocol behavior.
4. End with `Stop asystole`.

## 5. Audio and alarms
- Reference audio is embedded and works offline.
- If reference decoding fails, synthetic tones are used automatically.
- Startup alarm volume defaults to 10%.
- Continuous asystole alarm follows the volume slider in real time.

## 6. Assessment best practices
- Ask students to verbalize rhythm, rate, oxygenation, ventilation, and blood pressure.
- Change one axis at first; combine variables later.
- Introduce artifacts (for example, `ECG leads off`) to test clinical and technical judgment.
- Run a short debrief at the end of each case.

## 7. Troubleshooting
### No sound
1. Ensure `Sound` is enabled.
2. Raise `Alarm volume`.
3. Interact with the page (click/key) to unlock browser audio.

### Control-monitor not syncing
1. Confirm both windows are open.
2. Reopen `monitor.html` using `Open monitor`.

### Asystole not clearly visible
1. Ensure `Start asystole` is active.
2. Verify global simulation is not paused (`Pause/Start`).

## 8. Quick pre-class checklist
1. Open control and monitor windows.
2. Verify synchronization.
3. Confirm audio and volume.
4. Test `Start asystole` / `Stop asystole`.
5. Restore baseline profile.

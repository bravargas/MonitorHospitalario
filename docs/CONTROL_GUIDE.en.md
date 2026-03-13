# Control Panel Usage Guide (EN)

## 1. Purpose of the Control Panel
The control panel lets the instructor modify vital signs, trigger clinical events, simulate technical alarms, and manage the simulation pace in real time.

## 2. Quick Start (30 seconds)
1. Open `control.html`.
2. Open `monitor.html` via the **Open monitor** button.
3. Verify the sync status in the header.
4. Adjust the alarm volume for your room.
5. Select an initial profile (e.g. **Normal**).

## 3. Header Bar
### Sync status
- Indicates whether the student monitor is detected and receiving updates.

### Alarm active
- Global alarm status visible to the instructor only.
- Does not reveal diagnostic information to the student.

### Pause / Start
- Pauses or resumes the dynamic evolution of the simulator.

### Reset
- Returns to the normal clinical baseline to restart a practice session.

### Open monitor
- Opens the student view in a new tab/window.

## 4. Display Controls
### Grid
- Toggles the trace grid on the student monitor.

### Diagnostic
- Shows or hides diagnostic visual information in the student view.

## 5. Alarms and Audio
### Alarms
- Enables or silences the alarm system (logic and audio/status notification).

### Sound
- Enables or disables all audio in the simulator.

### Alarm volume
- Adjusts the global volume for alarms and tones.
- Default startup value: 10%.

## 6. Technical Alarms
These alarms are designed to train differential diagnosis between clinical failure and sensor failure.

### ECG leads off
- Simulates disconnected ECG electrodes.

### SpO2 sensor off
- Simulates a disconnected oxygen saturation sensor.

### TEMP probe off
- Simulates a disconnected temperature probe.

## 7. Patient Configuration
### Patient type
- Switches between adult, pediatric, and neonatal patient.
- Adjusts baseline physiological limits and behavior.

### Channel 2
- Selects the secondary waveform: CVP, ART2, PAP, ICP, or disconnected.

### ST profile
- Applies an ST-segment profile for ECG interpretation training.

### Patient name
- Patient label displayed on the monitor for the teaching scenario.

### ECG gain
- Adjusts the visual amplitude of the ECG trace.

### ECG sweep speed
- Adjusts the sweep speed (mm/s).

### Temperature unit
- Toggles the temperature unit between °C and °F.

## 8. Clinical Events
### Clinical event
- Selects a preconfigured event (desaturation, apnea, shock, etc.).

### Event duration / Hold phase
- Allows setting the total duration and hold phase of the event.

### Start event
- Initiates the physiological transition for the selected event.

### Stop event
- Stops the active event.

### NIBP now
- Forces a non-invasive blood pressure measurement immediately.

### Start asystole / Stop asystole
- Activates or deactivates asystole.
- Simulates a near-flat ECG line and triggers the associated critical alarm.

## 9. Profile Shortcut Buttons
Buttons such as **Normal**, **Tachycardia**, **Bradycardia**, **Hypoxia**, **Shock**, etc. apply predefined clinical states to set up scenarios in seconds.

## 10. Manual Variable Adjustment
The numeric controls and sliders area allows direct modification of:
- HR
- RESP
- SpO2
- ETCO2
- SYS/DIA
- CVP
- TEMP

Teaching recommendation:
1. Change one primary variable at the start.
2. Then combine 2 or 3 variables for greater clinical complexity.

## 11. Suggested Session Flow
1. Normal baseline state (30–60 s).
2. Introduce an event (e.g. desaturation).
3. Evaluate the student's verbal interpretation.
4. Add a technical artifact (e.g. SpO2 off) to differentiate clinical failure from sensor failure.
5. Close with a brief debriefing.

## 12. Control Troubleshooting
### The monitor does not reflect changes
1. Check the Sync status.
2. Press Open monitor and reopen the student view.

### No audio
1. Verify that Sound is enabled.
2. Raise the Alarm volume.
3. Click anywhere on the page to unblock browser audio.

### Asystole tone is not continuous
1. Verify that both Alarms and Sound are enabled.
2. Confirm that Start asystole is active.

## 13. Teaching Best Practices
1. Avoid giving verbal diagnostic hints at the start.
2. Encourage students to describe observable signs first.
3. Record response times and critical decision points.
4. Repeat scenarios with minor variations to measure learning progress.

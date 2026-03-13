# Changelog

All notable changes to this hospital monitor simulator are documented in this file.

## [1.1.0] - 2026-03-13

### Added
- Embedded NIBP inflation audio asset for offline use via `js/nibp-audio-asset.js`.
- NIBP status line inside the monitor NIBP section with explicit phase text and timing.

### Changed
- ATLS case patient label generation no longer uses gender-based invented names.
- ATLS patient label now uses `sex (age)` with `N/A` fallback when fields are missing.
- NIBP phase logic is now split into separate phases:
  - `Inflating`: duration follows the real NIBP audio clip length.
  - `Measuring`: fixed independent 5-second phase.

### Fixed
- NIBP inflation sound playback now prioritizes embedded MP3 playback paths before synthetic fallback.
- NIBP inflation audio no longer persists/restarts during `Measuring`.
- NIBP UI/audio synchronization improved so phase transitions and sound behavior match expected workflow.

## [1.0.0] - 2026-03-13

### Added
- Embedded reference audio asset for fully offline operation via `js/audio-asset.js`.
- Asystole simulation mode with instructor toggle (`Start asystole` / `Stop asystole`).
- Continuous asystole alarm tone (`beeeeeep`) with live volume response.
- Generic instructor-only alarm status pill (`Alarm active`) in the control header.

### Changed
- Audio engine now prefers MP3 reference tone always, with automatic synthetic fallback if decoding fails.
- Increased overall loudness with master compressor and gain staging for clearer classroom playback.
- Adjusted asystole alarm loudness to better match the perceived level of other alarms.
- Default alarm volume at startup changed to 10%.
- Monitor alarm text no longer reveals clinical alarm names to students.

### Fixed
- Alarm indicator priority mapping: critical alarms now correctly render as red.
- Continuous asystole tone now follows volume slider changes in real time.
- Local `file://` compatibility issues for reference audio playback.

### Removed
- Runtime dependency on `audio/Icu.mp3` file (audio is now embedded).
- Instructor UI toggle for `Reference MP3` (always-on behavior with fallback retained internally).
- Obsolete local server helpers:
  - `start-local-server.ps1`
  - `start-local-server.cmd`
  - `.vscode/tasks.json`

## Versioning notes
- This project currently uses date-based manual releases.
- Next suggested version: `1.1.0` for new scenarios or teaching workflows.

# Changelog

All notable changes to this hospital monitor simulator are documented in this file.

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

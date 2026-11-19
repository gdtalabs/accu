# ACCU clear notification audio

This patch makes notification audio more reliable and easier to verify.

- Real bundled WAV sound instead of synth-only audio
- Distinct normal and urgent alert sounds
- Full app audio volume
- Audio pre-unlock on first user interaction
- Web Audio fallback
- Test Sound button in Communications Center
- Existing vibration behavior preserved

For installed PWA users, close/reopen the app after deployment so the updated service worker cache is active.

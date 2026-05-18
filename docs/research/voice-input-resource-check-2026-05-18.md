# Voice Input Resource Check - 2026-05-18

## Problem

The browser side panel showed `Microphone permission was blocked.` after clicking `Dictate`.
The button was wired to browser `SpeechRecognition`, but Chrome can suppress microphone permission
prompts inside an extension side panel. The result is a real permission-path bug, not only a UI
label issue.

After permission was fixed, manual testing exposed a second real defect:

- dictation could stop when the speaker paused,
- short final result chunks could overwrite each other,
- the app could not force Chrome to use the Mac microphone when macOS/Chrome routed input through
  an iPhone Continuity microphone.
- long Chinese comments could arrive without punctuation,
- technical terms already present in the reviewed block, such as `Phase 0A`, could be misrecognized
  as everyday words such as `face`.

## Resources Considered

| Resource | License | Maintenance / Source Signal | Decision | Reason |
| --- | --- | --- | --- | --- |
| Chrome `tabs.create` API | Official Chrome docs | Current platform API | Use | Chrome docs state creating a tab does not require the `tabs` permission. This lets the extension open a permission helper page without broadening permissions. |
| MDN Web Speech contextual biasing / phrases | Documentation | Experimental platform API | Use when available | Phrase biasing can pass reviewed-block terms such as `Phase 0A`, `ChatGPT`, and `SDK` to browsers that support it. It must be optional because browser support is still experimental. |
| MDN `SpeechRecognition.continuous` | Documentation | Current API docs | Use | MDN documents `continuous` as the flag that returns continuous recognition results instead of one result. The app should request this mode for comment dictation. |
| MDN `SpeechRecognition` | Documentation | Current API docs | Use as platform boundary | MDN marks `SpeechRecognition` as limited availability and notes Chrome may use server-based recognition. Keep feature detection and privacy disclosure. |
| MDN `MediaDevices.enumerateDevices` and `getUserMedia` | Documentation | Current API docs | Future architecture reference | These APIs can list microphones and request a `MediaStream`, including device constraints. They do not feed that stream into browser `SpeechRecognition`. |
| `react-speech-recognition` | MIT | npm metadata checked: `4.0.1`, modified 2025-04-29 | Defer | It is a wrapper over Web Speech API. It does not fix side panel microphone permission suppression, so adding it would not solve the root cause. |
| `punctuation-restore` | MIT | npm metadata checked: `0.1.0` | Defer | It targets English punctuation/casing through ONNX runtime. It does not solve Chinese punctuation and adds a large runtime dependency. |
| `@huggingface/transformers` | Apache-2.0 | npm metadata checked: `4.2.0` | Defer | It could support a future local or browser-side transcription route, but it is too heavy for the current side-panel MVP and would need model-size, latency, and privacy testing. |
| `@xenova/transformers` | Apache-2.0 | npm metadata checked: `2.17.2` | Defer | Same family of browser ML approach. Useful reference, but not appropriate for a quick reliability fix. |
| `justinmann/sidepanel-audio-issue` | No license detected | Minimal repro repo | Reference only | It demonstrates the side panel permission problem and a helper-page workaround, but no license was detected, so do not copy code. |

Reference URLs:

- Chrome tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- MDN Using the Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
- MDN SpeechRecognition: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- MDN SpeechRecognition continuous: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/continuous
- MDN MediaDevices enumerateDevices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
- MDN MediaDevices getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN MediaTrackConstraints deviceId: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/deviceId
- Side panel microphone permission reproduction: https://stackoverflow.com/questions/78649316/accessing-the-microphone-from-a-chrome-extension-sidepanel
- `react-speech-recognition`: https://github.com/JamesBrill/react-speech-recognition
- `punctuation-restore`: https://github.com/jparkerweb/punctuation-restore
- `@huggingface/transformers`: https://github.com/huggingface/transformers.js

## Implementation Decision

Keep the lightweight Web Speech implementation and add a browser-extension-specific microphone
permission page:

- `Dictate` checks extension microphone permission before starting recognition.
- If permission is not granted, the side panel opens `voice-permission.html` in a normal tab.
- That page calls `navigator.mediaDevices.getUserMedia({ audio: true })`.
- After the user grants access, the page stops the audio tracks and asks the user to return to the
  side panel and click `Dictate` again.
- The extension still does not request `audioCapture`, `tabs`, or broad host permissions.

For the continuous dictation defect:

- Request `continuous = true` and `interimResults = true`.
- Keep listening across browser `onend` events while the user has not clicked `Stop`.
- Commit final result chunks immediately and preserve interim text on stop/restart.
- Store the latest textarea draft in a ref so multiple recognition callbacks append instead of
  overwriting each other.
- Extract technical terms from the reviewed block and pass them to `SpeechRecognitionPhrase` when
  the browser exposes phrase biasing.
- Add local post-processing before writing transcript text into the comment field:
  - normalize likely `face0a` / `face01` misrecognition to `Phase 0A` only when the reviewed block
    contains `Phase`,
  - preserve normal `face` usage when the selected block does not contain `Phase`,
  - add lightweight Chinese punctuation around common spoken connectors and sentence endings.
- Do not add `react-speech-recognition` yet because it wraps the same browser API and does not add
  device selection or stronger recognition quality.
- Do not add a punctuation-restoration package yet because the mature lightweight options found do
  not cover Chinese reliably without adding a separate model/runtime.

For microphone device selection:

- Current Web Speech mode cannot reliably force the Mac microphone from app code.
- If Chrome/macOS routes the browser's default audio input to iPhone Continuity, the user must
  change the input source in macOS/Chrome settings.
- A future higher-reliability route would need `enumerateDevices`/`getUserMedia` device selection,
  `MediaRecorder` capture, and a transcription engine/API that accepts recorded audio. That is a
  separate architecture decision because it changes privacy, cost, latency, and deployment scope.

## Risks

- Web Speech remains Chrome/browser dependent and is not guaranteed offline.
- The user may still need to allow Chrome microphone access at the macOS/OS level.
- If the user previously blocked microphone permission for the extension origin, they may need to
  change it in Chrome site settings.
- The helper-page pattern improves the permission path but does not make browser speech recognition
  universally available.
- Continuous restart reduces pause-related dropouts, but browser speech recognition can still lose
  words under network, engine, microphone, noise, or OS input-routing problems.
- Local punctuation and term correction are conservative helpers, not a full language-model proofread.
  The reviewer can still edit the comment before adding it.

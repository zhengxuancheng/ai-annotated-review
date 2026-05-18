# Voice Input Resource Check - 2026-05-18

## Problem

The browser side panel showed `Microphone permission was blocked.` after clicking `Dictate`.
The button was wired to browser `SpeechRecognition`, but Chrome can suppress microphone permission
prompts inside an extension side panel. The result is a real permission-path bug, not only a UI
label issue.

## Resources Considered

| Resource | License | Maintenance / Source Signal | Decision | Reason |
| --- | --- | --- | --- | --- |
| Chrome `tabs.create` API | Official Chrome docs | Current platform API | Use | Chrome docs state creating a tab does not require the `tabs` permission. This lets the extension open a permission helper page without broadening permissions. |
| MDN `SpeechRecognition` | Documentation | Current API docs | Use as platform boundary | MDN marks `SpeechRecognition` as limited availability and notes Chrome may use server-based recognition. Keep feature detection and privacy disclosure. |
| `react-speech-recognition` | MIT | npm metadata checked: `4.0.1`, modified 2025-04-29 | Defer | It is a wrapper over Web Speech API. It does not fix side panel microphone permission suppression, so adding it would not solve the root cause. |
| `justinmann/sidepanel-audio-issue` | No license detected | Minimal repro repo | Reference only | It demonstrates the side panel permission problem and a helper-page workaround, but no license was detected, so do not copy code. |

Reference URLs:

- Chrome tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- MDN SpeechRecognition: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- Side panel microphone permission reproduction: https://stackoverflow.com/questions/78649316/accessing-the-microphone-from-a-chrome-extension-sidepanel
- `react-speech-recognition`: https://github.com/JamesBrill/react-speech-recognition

## Implementation Decision

Keep the lightweight Web Speech implementation and add a browser-extension-specific microphone
permission page:

- `Dictate` checks extension microphone permission before starting recognition.
- If permission is not granted, the side panel opens `voice-permission.html` in a normal tab.
- That page calls `navigator.mediaDevices.getUserMedia({ audio: true })`.
- After the user grants access, the page stops the audio tracks and asks the user to return to the
  side panel and click `Dictate` again.
- The extension still does not request `audioCapture`, `tabs`, or broad host permissions.

## Risks

- Web Speech remains Chrome/browser dependent and is not guaranteed offline.
- The user may still need to allow Chrome microphone access at the macOS/OS level.
- If the user previously blocked microphone permission for the extension origin, they may need to
  change it in Chrome site settings.
- The helper-page pattern improves the permission path but does not make browser speech recognition
  universally available.

import "./voice-permission.css";

const statusElement = document.getElementById("permission-status");
const requestButton = document.getElementById("request-microphone") as HTMLButtonElement | null;

requestButton?.addEventListener("click", () => {
  void requestMicrophonePermission();
});

void requestMicrophonePermission();

async function requestMicrophonePermission(): Promise<void> {
  if (!statusElement || !requestButton) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    statusElement.textContent = "This browser does not expose microphone access to extension pages.";
    requestButton.disabled = true;
    return;
  }

  requestButton.disabled = true;
  statusElement.textContent = "Waiting for Chrome microphone permission...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    statusElement.textContent =
      "Microphone enabled. Return to the review side panel and click Dictate again.";
    window.setTimeout(() => window.close(), 1200);
  } catch {
    statusElement.textContent =
      "Microphone access was not enabled. Click the button to try again, or check Chrome and macOS microphone settings.";
    requestButton.disabled = false;
  }
}

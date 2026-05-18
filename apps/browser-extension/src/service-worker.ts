type ChromeRuntime = {
  runtime?: {
    onInstalled?: { addListener: (listener: () => void) => void };
  };
  sidePanel?: {
    setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>;
  };
};

const chromeApi = (globalThis as unknown as { chrome?: ChromeRuntime }).chrome;

chromeApi?.runtime?.onInstalled?.addListener(() => {
  chromeApi.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {
      // Chrome reports setup issues through the extension error UI.
    });
});

export const startTabMonitoring = (logEvent) => {
  // Detect tab switch
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      logEvent("TAB_SWITCH");
    }
  });

  // Detect window minimize / app switch
  window.addEventListener("blur", () => {
    logEvent("WINDOW_BLUR");
  });
};

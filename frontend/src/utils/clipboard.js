export const blockClipboard = (logEvent) => {
    document.addEventListener("copy", (e) => {
      e.preventDefault();
      logEvent("COPY_ATTEMPT");
    });
  
    document.addEventListener("paste", (e) => {
      e.preventDefault();
      logEvent("PASTE_ATTEMPT");
    });
  };
  
// utils/fullscreen.js

// ---------------- ENTER FULLSCREEN ----------------
export const enterFullscreen = async () => {
  const element = document.documentElement;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } catch (err) {
    console.error("Fullscreen request failed:", err);
  }
};

// ---------------- EXIT FULLSCREEN ----------------
export const exitFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } catch (err) {
    console.error("Fullscreen exit failed:", err);
  }
};

// ---------------- CHECK FULLSCREEN STATE ----------------
export const isFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
};

// ---------------- LISTEN FOR FULLSCREEN CHANGE ----------------
export const addFullscreenListener = (callback) => {
  document.addEventListener("fullscreenchange", callback);
  document.addEventListener("webkitfullscreenchange", callback);
  document.addEventListener("msfullscreenchange", callback);
};

export const removeFullscreenListener = (callback) => {
  document.removeEventListener("fullscreenchange", callback);
  document.removeEventListener("webkitfullscreenchange", callback);
  document.removeEventListener("msfullscreenchange", callback);
};

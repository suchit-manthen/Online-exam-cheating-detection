import { useEffect, useRef } from "react";
import WebcamLib from "react-webcam";

function Webcam({ onCapture, warning }) {
  const webcamRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) onCapture(imageSrc);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [onCapture]);

  // 🔥 BORDER COLOR LOGIC
  const borderColor =
    warning === "FINAL_WARNING" || warning === "PHONE_DETECTED"
      ? "#dc2626"
      : warning
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div
      style={{
        padding: 6,
        borderRadius: 18,
        background: "#020617",
        border: `3px solid ${borderColor}`,
        transition: "border 0.3s ease",
        boxShadow: "0 12px 35px rgba(0,0,0,0.35)",
        animation:
          warning === "FINAL_WARNING" || warning === "PHONE_DETECTED"
            ? "pulse 1.2s infinite"
            : "none"
      }}
    >
      <div style={styles.videoWrapper}>
        <WebcamLib
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          style={styles.video}
        />
      </div>

      {/* 🔥 Inline animation keyframes */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
            70% { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
            100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  videoWrapper: {
    width: "100%",
    aspectRatio: "4 / 3",      // ✅ Stable camera ratio
    borderRadius: 14,
    overflow: "hidden",        // ✅ No border cutting
    background: "#000"
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover"         // ✅ No stretching, no cropping
  }
};

export default Webcam;

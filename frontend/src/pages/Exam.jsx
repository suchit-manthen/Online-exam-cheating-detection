import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import Webcam from "../components/Webcam";
import { questions } from "../data/questions";
import { startTabMonitoring } from "../utils/monitor";
import { blockClipboard } from "../utils/clipboard";
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  addFullscreenListener,
  removeFullscreenListener
} from "../utils/fullscreen";

function Exam() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const [warning, setWarning] = useState(null);

  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [countdown, setCountdown] = useState(5);

  const timerRef = useRef(null);

  // ---------------- START EXAM ----------------
  useEffect(() => {
    fetch(`${API_BASE}/start-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam_id: "ai_exam_1" })
    })
      .then(res => res.json())
      .then(async data => {
        setAttemptId(data.attempt_id);
        await enterFullscreen();
      })
      .catch(err => console.error(err));
  }, []);

  // ---------------- FULLSCREEN DETECTION ----------------
  useEffect(() => {
    if (!attemptId || submitted) return;

    const handleFullscreenChange = () => {
      if (!isFullscreen()) {
        setFullscreenWarning(true);
        setCountdown(5);

        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);

              setFullscreenExitCount(prevCount => {
                const newCount = prevCount + 1;

                if (newCount === 1) {
                  logEvent("FULLSCREEN_EXIT_WARNING");
                } else if (newCount === 2) {
                  logEvent("FULLSCREEN_EXIT_REPEAT");
                } else {
                  logEvent("FULLSCREEN_TERMINATED");
                  setTerminated(true);
                }

                return newCount;
              });

              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } else {
        clearInterval(timerRef.current);
        setFullscreenWarning(false);
      }
    };

    addFullscreenListener(handleFullscreenChange);

    return () => {
      removeFullscreenListener(handleFullscreenChange);
      clearInterval(timerRef.current);
    };
  }, [attemptId, submitted]);

  const reEnterFullscreen = async () => {
    await enterFullscreen();
    setFullscreenWarning(false);
  };

  // ---------------- LOG EVENTS ----------------
  const logEvent = async (event) => {
    if (!attemptId || submitted || terminated) return;

    try {
      const res = await fetch(`${API_BASE}/log-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, attempt_id: attemptId })
      });

      const data = await res.json();

      if (data.warning) setWarning(data.warning);
      if (data.status === "TERMINATED") setTerminated(true);

    } catch (err) {
      console.error("Log failed:", err);
    }
  };

  // ---------------- TAB + CLIPBOARD MONITOR ----------------
  useEffect(() => {
    if (!submitted && !terminated && attemptId) {
      startTabMonitoring(logEvent);
      blockClipboard(logEvent);
    }
  }, [submitted, terminated, attemptId]);

  // ---------------- WEBCAM MONITOR ----------------
  const sendFrameToBackend = async (image) => {
    if (!attemptId || submitted || terminated) return;

    try {
      const res = await fetch(`${API_BASE}/analyze-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, attempt_id: attemptId })
      });

      const data = await res.json();

      if (data.warning) setWarning(data.warning);
      if (data.identity_mismatch) setWarning("IDENTITY_MISMATCH");
      if (data.status === "TERMINATED") setTerminated(true);

    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    await fetch(`${API_BASE}/end-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: attemptId })
    });

    await exitFullscreen();
    setSubmitted(true);
  };

  // ... keep all your logic, hooks, and imports above this ...

  // ---------------- TERMINATED ----------------
  if (terminated) {
    // ... keep your existing terminated UI or style it similarly ...
    return (
      <div style={styles.fullPageCenter}>
        <div style={styles.statusCard}>
          <div style={styles.iconCircleError}>!</div>
          <h2 style={styles.statusTitle}>Exam Terminated</h2>
          <p style={styles.statusText}>Fullscreen violation or integrity breach detected.</p>
          <button style={styles.dangerBtn} onClick={() => navigate("/")}>Return Home</button>
        </div>
      </div>
    );
  }

  // ---------------- SUBMITTED ----------------
  if (submitted) {
    return (
      <div style={styles.fullPageCenter}>
        <div style={styles.statusCard}>
          <div style={styles.iconCircleSuccess}>✓</div>
          <h2 style={styles.statusTitle}>Submission Successful</h2>
          <p style={styles.statusText}>Your exam has been uploaded securely.</p>
          <button style={styles.submitBtn} onClick={() => navigate("/")}>Return Home</button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN EXAM UI ----------------
  return (
    <div style={styles.page}>

      {/* Fullscreen Warning Overlay */}
      {fullscreenWarning && (
        <div style={styles.fullscreenOverlay}>
          <div style={styles.fullscreenModal}>
            <div style={styles.iconCircleError}>!</div>
            <h3 style={styles.statusTitle}>Fullscreen Required</h3>
            <p style={styles.statusText}>Return within {countdown} seconds</p>
            <button style={styles.primaryBtn} onClick={reEnterFullscreen}>
              Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>🛡️</span>
          <span style={styles.logoText}>SecureExam</span>
        </div>
        <div style={styles.timerBadge}>
           <span>⏱️ Time Remaining: 45:00</span> {/* Placeholder for timer */}
        </div>
        <button style={styles.finishBtn} onClick={handleSubmit}>Finish Exam</button>
      </header>

      {/* Warning Banner */}
      {warning && (
        <div style={{...styles.warningBanner, ...getWarningStyle(warning)}}>
          {getWarningMessage(warning)}
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={styles.mainContainer}>
        <div style={styles.contentGrid}>
          
          {/* Left Column: Questions */}
          <div style={styles.leftColumn}>
            <div style={styles.scrollableContent}>
              
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.qLabel}>Question {current + 1}</span>
                  <span style={styles.qTotal}>of {questions.length}</span>
                </div>
                
                <h3 style={styles.questionText}>{questions[current].question}</h3>
                
                <br />

                {/* Options */}
                <div style={styles.optionsList}>
                  {questions[current].options.map((opt, idx) => {
                    const isSelected = answers[current] === idx;
                    return (
                      <div 
                        key={idx} 
                        style={{
                          ...styles.optionCard, 
                          ...(isSelected ? styles.optionSelected : {})
                        }}
                        onClick={() => setAnswers({ ...answers, [current]: idx })}
                      >
                        <div style={{
                          ...styles.optionKey,
                          ...(isSelected ? styles.optionKeySelected : {})
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span style={styles.optionText}>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div style={styles.navBar}>
                <button 
                  style={current === 0 ? {...styles.navBtn, ...styles.navBtnDisabled} : styles.navBtn}
                  onClick={() => setCurrent(c => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  Previous
                </button>

                {current < questions.length - 1 ? (
                  <button style={styles.primaryBtn} onClick={() => setCurrent(c => c + 1)}>
                    Next Question
                  </button>
                ) : (
                  <button style={styles.submitBtn} onClick={handleSubmit}>
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar / Palette */}
          <div style={styles.sidebar}>
            <div style={styles.paletteCard}>
              <div style={styles.sidebarTitle}>Question Palette</div>
              <div style={styles.paletteGrid}>
                {questions.map((_, idx) => {
                   const isAnswered = answers[idx] !== undefined;
                   const isCurrent = current === idx;
                   let dotStyle = styles.paletteDot;
                   if (isCurrent) dotStyle = {...dotStyle, ...styles.paletteDotActive};
                   else if (isAnswered) dotStyle = {...dotStyle, ...styles.paletteDotAnswered};

                   return (
                     <div 
                        key={idx} 
                        style={dotStyle}
                        onClick={() => setCurrent(idx)}
                     >
                       {idx + 1}
                     </div>
                   );
                })}
              </div>
              
              <div style={styles.legend}>
                <div style={styles.legendItem}>
                  <div style={{...styles.dotMini, background: "#4f46e5"}}></div> Current
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.dotMini, background: "#10b981"}}></div> Answered
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Webcam Widget Wrapper */}
      <div style={styles.webcamWidget}>
         <div style={styles.webcamHeader}>
            <div style={styles.webcamTitle}>
               <div style={styles.pulsingDot}></div> Live Monitoring
            </div>
         </div>
         <div style={styles.webcamFrame}>
            {/* Pass generic styles if your Webcam component accepts style props, 
                otherwise this div wrapper handles the positioning */}
            <Webcam onCapture={sendFrameToBackend} warningLevel={warning} />
         </div>
         <div style={styles.webcamStatus}>
            Status: {warning ? "Suspicious" : "Secure"}
         </div>
      </div>

    </div>
  );
}

const getWarningStyle = (w) => {
  if (w === "PHONE_DETECTED" || w === "FINAL_WARNING") return styles.warningCritical;
  if (w === "WARNING_YELLOW") return styles.warningHigh;
  return styles.warningMedium;
};

const getWarningMessage = (w) => {
  if (w === "PHONE_DETECTED") return "Cell phone detected.";
  if (w === "FULLSCREEN_EXIT") return "You exited fullscreen. Return immediately or exam will terminate.";
  if (w === "FINAL_WARNING") return "Final warning.";
  if (w === "WARNING_YELLOW") return "Suspicious behavior detected.";
  if (w === "IDENTITY_MISMATCH") return "Identity mismatch detected.";
  return "Warning issued.";
};

/* ---------------- MODERN STYLES (Fixed Scroll) ---------------- */

const styles = {
  page: {
    height: "100vh", // Lock height to viewport
    width: "100vw",  // Lock width to viewport
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
    color: "#1e293b",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden" // NO SCROLL ON BODY
  },
  
  /* HEADER */
  header: {
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 32px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0, // Prevent header from shrinking
    zIndex: 50,
  },
  logoArea: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 24 },
  logoText: { fontWeight: 700, fontSize: 18, color: "#4f46e5", letterSpacing: "-0.5px" },
  
  timerBadge: {
    background: "#f1f5f9",
    padding: "8px 16px",
    borderRadius: 99,
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #e2e8f0"
  },
  finishBtn: {
    background: "transparent",
    border: "2px solid #ef4444",
    color: "#ef4444",
    padding: "8px 20px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },

  /* WARNING BANNER */
  warningBanner: {
    position: "absolute",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: 12,
    textAlign: "center",
    fontWeight: 600,
    fontSize: 15,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    zIndex: 100,
    animation: "slideDown 0.3s ease-out"
  },
  warningCritical: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
  warningHigh: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
  warningMedium: { background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5" },

  /* MAIN LAYOUT (The Fix) */
  mainContainer: {
    flex: 1, // Take remaining height
    display: "flex",
    justifyContent: "center",
    padding: "20px",
    overflow: "hidden" // Internal scrolling only
  },
  
  contentGrid: {
    width: "100%",
    maxWidth: "1200px",
    display: "grid",
    gridTemplateColumns: "1fr 320px", // Main Content vs Sidebar
    gap: "24px",
    height: "100%", // Fill container
  },

  /* LEFT COLUMN (Questions) */
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflow: "hidden"
  },

  scrollableContent: {
    flex: 1, // Fill available space
    overflowY: "auto", // SCROLL HERE if content is long
    paddingRight: "8px", // Space for scrollbar
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  /* QUESTION CARD */
  questionCard: {
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "16px"
  },
  qLabel: { color: "#4f46e5", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "1px" },
  qTotal: { color: "#94a3b8", fontSize: 13, fontWeight: 500 },
  questionText: { fontSize: "22px", lineHeight: 1.5, fontWeight: 600, color: "#1e293b", margin: 0 },

  /* OPTIONS */
  optionsList: { display: "flex", flexDirection: "column", gap: "12px" },
  optionCard: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  optionSelected: {
    borderColor: "#4f46e5",
    background: "#eef2ff",
    boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.1)"
  },
  optionKey: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    marginRight: "16px",
    fontSize: "14px"
  },
  optionKeySelected: {
    background: "#4f46e5",
    color: "white"
  },
  optionText: { fontSize: "16px", fontWeight: 500, color: "#334155" },

  /* NAV BAR */
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "10px",
    flexShrink: 0
  },
  navBtn: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer"
  },
  navBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  primaryBtn: {
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
  },
  submitBtn: {
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    background: "#10b981",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
  },

  /* SIDEBAR PALETTE */
  sidebar: { 
    display: "flex", 
    flexDirection: "column",
    height: "fit-content" // Or "100%" if you want it to stretch
  },
  paletteCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9"
  },
  sidebarTitle: { fontSize: "15px", fontWeight: 700, marginBottom: "16px", color: "#1e293b" },
  paletteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "10px",
    marginBottom: "24px"
  },
  paletteDot: {
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  paletteDotActive: { background: "#4f46e5", color: "white", borderColor: "#4f46e5" },
  paletteDotAnswered: { background: "#10b981", color: "white", borderColor: "#10b981" },

  legend: { display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  dotMini: { width: "8px", height: "8px", borderRadius: "50%" },

  /* WEBCAM WIDGET */
  webcamWidget: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    width: "260px",
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #e2e8f0",
    zIndex: 100
  },
  webcamHeader: {
    padding: "10px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  },
  webcamTitle: { fontSize: "12px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "8px" },
  pulsingDot: { width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)" },
  webcamFrame: { background: "black", height: "160px" },
  webcamStatus: { padding: "8px", textAlign: "center", fontSize: "11px", color: "#94a3b8", background: "white", borderTop: "1px solid #e2e8f0" },

  /* FULL PAGE STATUS STATES */
  fullPageCenter: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif"
  },
  statusCard: {
    background: "white",
    padding: "60px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    border: "1px solid #e2e8f0"
  },
  fullscreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  
  fullscreenModal: {
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    width: "400px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
  },
  iconCircleError: { width: "80px", height: "80px", background: "#fee2e2", color: "#ef4444", fontSize: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", margin: "0 auto 24px" },
  iconCircleSuccess: { width: "80px", height: "80px", background: "#dcfce7", color: "#16a34a", fontSize: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", margin: "0 auto 24px" },
  statusTitle: { fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" },
  statusText: { fontSize: "16px", color: "#64748b", lineHeight: 1.6, marginBottom: "32px" },
  dangerBtn: { padding: "12px 30px", borderRadius: "12px", border: "none", background: "#ef4444", color: "white", fontWeight: 600, cursor: "pointer" }
};

export default Exam;
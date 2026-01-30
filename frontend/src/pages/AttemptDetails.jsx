import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

// INSTRUCTIONS:
// Ensure you have this font imported in your index.html or index.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

function AttemptDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/attempt/${id}/details`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading attempt data...</div>;
  if (!data || !data.attempt) return <div style={styles.error}>Attempt not found.</div>;

  const { attempt, events } = data;
  
  // Calculate running score for the table
  let runningScore = 0;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logoIcon}>🛡️</span>
          <h1 style={styles.brandTitle}>SecureExam Admin</h1>
        </div>
        <div style={styles.profile}>
          <span style={styles.adminBadge}>Administrator</span>
          <div style={styles.avatar}>AD</div>
        </div>
      </header>

      <main style={styles.container}>
        {/* NAV & TITLE */}
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back to Dashboard
        </button>

        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.title}>Session Analysis</h2>
            <p style={styles.subtitle}>
              Reviewing session <strong>#{attempt.id}</strong> for User <strong>{attempt.user_id}</strong>
            </p>
          </div>
          <div style={styles.headerActions}>
             <StatusBadge status={attempt.status} />
          </div>
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div style={styles.statsGrid}>
          {/* User Card */}
          <div style={styles.card}>
            <span style={styles.cardIcon}>👤</span>
            <div>
              <p style={styles.cardLabel}>Student ID</p>
              <h3 style={styles.cardValue}>{attempt.user_id}</h3>
            </div>
          </div>

          {/* Exam Card */}
          <div style={styles.card}>
            <span style={styles.cardIcon}>📝</span>
            <div>
              <p style={styles.cardLabel}>Exam ID</p>
              <h3 style={styles.cardValue}>{attempt.exam_id}</h3>
            </div>
          </div>

          {/* Time Card */}
          <div style={styles.card}>
            <span style={styles.cardIcon}>⏱️</span>
            <div>
              <p style={styles.cardLabel}>Started At</p>
              <h3 style={styles.cardValue}>
                {new Date(attempt.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </h3>
            </div>
          </div>

          {/* Risk Score Card (Highlighted) */}
          <div style={{...styles.card, ...getRiskCardStyle(attempt.cheating_score)}}>
            <span style={styles.cardIcon}>📉</span>
            <div>
              <p style={{...styles.cardLabel, color: 'inherit', opacity: 0.8}}>Risk Score</p>
              <h3 style={{...styles.cardValue, color: 'inherit'}}>{attempt.cheating_score} Points</h3>
            </div>
          </div>
        </div>

        {/* ================= TIMELINE TABLE ================= */}
        <div style={styles.sectionContainer}>
          <h3 style={styles.sectionTitle}>Detailed Event Log</h3>
          
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Detected Event</th>
                  <th style={styles.th}>Severity</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Cumulative Score</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((e, i) => {
                    runningScore += e.weight;
                    return (
                      <tr key={i} style={styles.row}>
                        <td style={styles.td}>
                           {new Date(e.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </td>
                        <td style={styles.td}>
                          <EventBadge type={e.event_type} />
                        </td>
                        <td style={styles.td}>
                          <span style={styles.weightBadge}>+{e.weight}</span>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <strong style={{color: getScoreColor(runningScore)}}>{runningScore}</strong>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={styles.emptyState}>
                      ✅ Clean Session - No suspicious events recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const StatusBadge = ({ status }) => {
  const config = {
    COMPLETED: { bg: "#dcfce7", color: "#166534", icon: "✅" },
    ONGOING:   { bg: "#dbeafe", color: "#1e40af", icon: "⚡" },
    FLAGGED:   { bg: "#fef3c7", color: "#92400e", icon: "⚠️" },
    TERMINATED:{ bg: "#fee2e2", color: "#991b1b", icon: "🚫" }
  };
  const style = config[status] || config.COMPLETED;

  return (
    <span style={{...styles.badge, background: style.bg, color: style.color}}>
      <span style={{marginRight: 6}}>{style.icon}</span>
      {status}
    </span>
  );
};

const EventBadge = ({ type }) => {
  let style = { bg: "#f1f5f9", color: "#475569", icon: "ℹ️" }; // Default

  if (type === "PHONE_DETECTED") style = { bg: "#fee2e2", color: "#991b1b", icon: "📱" };
  else if (type === "MULTIPLE_FACES") style = { bg: "#fee2e2", color: "#991b1b", icon: "👥" };
  else if (type.includes("LOOKING")) style = { bg: "#fff7ed", color: "#c2410c", icon: "👀" };
  else if (type === "TAB_SWITCH" || type === "WINDOW_BLUR") style = { bg: "#fffbeb", color: "#b45309", icon: "⚠️" };
  
  return (
    <span style={{...styles.eventBadge, background: style.bg, color: style.color}}>
      <span style={{marginRight: 6}}>{style.icon}</span>
      {type.replace(/_/g, " ")}
    </span>
  );
};

/* ================= HELPERS ================= */
const getRiskCardStyle = (score) => {
  if (score >= 15) return { background: "#ef4444", color: "white" };
  if (score >= 8) return { background: "#f59e0b", color: "white" };
  return { background: "#10b981", color: "white" };
};

const getScoreColor = (score) => {
  if (score >= 15) return "#dc2626";
  if (score >= 8) return "#d97706";
  return "#059669";
};

/* ================= STYLES (Inter Font) ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
    color: "#1e293b",
    paddingBottom: 40
  },
  
  /* HEADER */
  header: {
    background: "white",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },
  logoIcon: { fontSize: 24 },
  profile: { display: "flex", alignItems: "center", gap: 16 },
  adminBadge: { fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0" },
  avatar: { width: 40, height: 40, background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)" },

  /* CONTAINER */
  container: { maxWidth: 1000, margin: "0 auto", padding: "40px 20px" },

  backBtn: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    padding: 0
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30
  },
  title: { fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: 14, color: "#64748b", margin: 0 },

  /* STATS GRID */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 40
  },
  card: {
    background: "white",
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  cardIcon: { fontSize: 24, background: "rgba(0,0,0,0.04)", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, color: "#64748b", marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },

  /* TABLE SECTION */
  sectionContainer: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#334155" },
  
  tableCard: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "16px 24px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc"
  },
  row: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "16px 24px", fontSize: 14, color: "#334155" },
  
  emptyState: { padding: 40, textAlign: "center", color: "#10b981", fontWeight: 600 },

  /* BADGES */
  badge: { padding: "6px 12px", borderRadius: 99, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center" },
  
  eventBadge: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center"
  },
  
  weightBadge: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #e2e8f0"
  },

  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#64748b", fontSize: 16 },
  error: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#ef4444", fontSize: 16 }
};

export default AttemptDetails;
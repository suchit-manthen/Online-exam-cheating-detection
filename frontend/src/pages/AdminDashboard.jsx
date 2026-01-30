import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

// INSTRUCTIONS:
// Ensure you have this font imported in your index.html or index.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

function AdminDashboard() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/attempts`)
      .then(res => res.json())
      .then(data => setAttempts(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // 🧠 Logic: Filter by Status AND Search Term
  const filteredAttempts = attempts.filter(a => {
    const matchesStatus = filter === "ALL" || a.status === filter;
    const matchesSearch = a.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const total = attempts.length;
  const completed = attempts.filter(a => a.status === "COMPLETED").length;
  const ongoing = attempts.filter(a => a.status === "ONGOING").length;
  const flagged = attempts.filter(a => a.status === "FLAGGED").length;
  const terminated = attempts.filter(a => a.status === "TERMINATED").length;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logoIcon}>🛡️</span>
          <h1>SecureExam Admin</h1>
        </div>
        <div style={styles.profile}>
          <span style={styles.adminBadge}>Administrator</span>
          <div style={styles.avatar}>AD</div>
        </div>
      </header>

      <main style={styles.container}>
        {/* ================= STATS ROW ================= */}
        <div style={styles.statsGrid}>
          <StatCard 
            label="Total Sessions" 
            value={total} 
            icon="📂" 
            color="white" 
            trend="+12% today" 
          />
          <StatCard 
            label="Active Exams" 
            value={ongoing} 
            icon="⚡" 
            color="white" 
            activeColor="#3b82f6"
            trend="Live Now"
          />
          <StatCard 
            label="Flagged Incidents" 
            value={flagged} 
            icon="🚩" 
            color="#fff7ed" 
            textColor="#c2410c"
            trend="Needs Review"
          />
          <StatCard 
            label="Terminated" 
            value={terminated} 
            icon="🚫" 
            color="#fef2f2" 
            textColor="#b91c1c"
            trend="High Risk"
          />
        </div>

        {/* ================= CONTROLS ROW ================= */}
        <div style={styles.controls}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {["ALL", "ONGOING", "FLAGGED", "TERMINATED", "COMPLETED"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.tabBtn,
                  ...(filter === f ? styles.tabBtnActive : {})
                }}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Student ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* ================= DATA TABLE ================= */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student ID</th>
                <th style={styles.th}>Exam ID</th>
                <th style={styles.th}>Started At</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Risk Score</th>
                <th style={{...styles.th, textAlign: 'right'}}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttempts.length > 0 ? (
                filteredAttempts.map(a => (
                  <tr key={a.id} style={styles.row}>
                    <td style={styles.td}>
                      <span style={styles.studentId}>{a.user_id}</span>
                    </td>
                    <td style={styles.td}>{a.exam_id}</td>
                    <td style={styles.td}>
                      {new Date(a.started_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={styles.td}>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={styles.td}>
                      <RiskScore score={a.cheating_score} />
                    </td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <button
                        style={styles.viewBtn}
                        onClick={() => navigate(`/admin/attempt/${a.id}`)}
                      >
                        Review Log →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={styles.emptyState}>
                    No attempts found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const StatCard = ({ label, value, icon, color, textColor, activeColor, trend }) => (
  <div style={{...styles.statCard, background: color}}>
    <div style={styles.statTop}>
      <div style={{...styles.statIcon, background: activeColor ? activeColor : 'rgba(0,0,0,0.05)'}}>
        {icon}
      </div>
      <span style={{...styles.trendBadge, color: textColor || '#64748b'}}>
        {trend}
      </span>
    </div>
    <div style={styles.statBottom}>
      <h3 style={{...styles.statValue, color: textColor || '#0f172a'}}>{value}</h3>
      <p style={styles.statLabel}>{label}</p>
    </div>
  </div>
);

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
      <span style={{marginRight: 4}}>{style.icon}</span>
      {status}
    </span>
  );
};

const RiskScore = ({ score }) => {
  let color = "#10b981"; // Green
  let width = "10%";
  
  if (score > 5) { color = "#f59e0b"; width = "40%"; } // Yellow
  if (score > 12) { color = "#ef4444"; width = "80%"; } // Red
  if (score > 20) { width = "100%"; }

  return (
    <div style={styles.riskWrapper}>
      <div style={styles.riskTrack}>
        <div style={{...styles.riskFill, width: width, background: color}} />
      </div>
      <span style={{...styles.riskText, color: color}}>{score} pts</span>
    </div>
  );
}

/* ================= STYLES (Inter Font) ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
    color: "#1e293b"
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
  profile: {
    display: "flex",
    alignItems: "center",
    gap: 16 // Creates proper space between Badge and Avatar
  },
  logoIcon: { fontSize: 24 },
  adminBadge: { fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 },
  avatar: { width: 36, height: 36, background: "#4f46e5", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginLeft: 12 },
  
  /* CONTAINER */
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 20px"
  },

  /* STATS GRID */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
    marginBottom: 40
  },
  statCard: {
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: 140
  },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  trendBadge: { fontSize: 12, fontWeight: 600 },
  statValue: { fontSize: 32, fontWeight: 700, margin: "10px 0 0" },
  statLabel: { fontSize: 14, color: "#64748b", margin: 0 },

  /* CONTROLS */
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 20
  },
  tabs: {
    background: "#e2e8f0",
    padding: 4,
    borderRadius: 10,
    display: "flex",
    gap: 4
  },
  tabBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  tabBtnActive: {
    background: "white",
    color: "#0f172a",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  searchWrapper: {
    position: "relative",
    width: 300
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: 14
  },
  searchInput: {
    width: "100%",
    padding: "10px 10px 10px 36px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
    transition: "border-color 0.2s"
  },

  /* TABLE */
  tableCard: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
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
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc"
  },
  row: { borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" },
  td: { padding: "16px 24px", fontSize: 14 },
  
  studentId: { fontFamily: "monospace", fontWeight: 600, color: "#334155" },
  badge: {
    padding: "4px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center"
  },
  
  /* RISK SCORE COMPONENT */
  riskWrapper: { display: "flex", alignItems: "center", gap: 10 },
  riskTrack: { width: 60, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  riskFill: { height: "100%", borderRadius: 99 },
  riskText: { fontSize: 12, fontWeight: 700 },

  viewBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  emptyState: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }
};

export default AdminDashboard;
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
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/admin/attempts`)
      .then(res => res.json())
      .then(data => setAttempts(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

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

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <h1>SecureExam Admin</h1>
        </div>

        <div 
          style={styles.profileWrapper}
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <div style={styles.profile}>
            <span style={styles.adminBadge}>Administrator</span>
            <div style={styles.avatar}>AD</div>
          </div>

          {showProfileMenu && (
            <div style={styles.dropdownMenu}>
              <button 
                onClick={handleLogout} 
                style={styles.logoutBtn}
                onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={styles.container}>
        {/* ================= STATS ROW ================= */}
        <div style={styles.statsGrid}>
          <StatCard 
            label="Total Sessions" 
            value={total} 
            accentColor="#3b82f6" // Blue
            trend="+12% today"
            trendColor="#166534"
            trendBg="#dcfce7"
          />
          <StatCard 
            label="Active Exams" 
            value={ongoing} 
            accentColor="#6366f1" // Indigo
            trend="Live Now"
            trendColor="#1e40af"
            trendBg="#dbeafe"
          />
          <StatCard 
            label="Flagged Incidents" 
            value={flagged} 
            accentColor="#f59e0b" // Amber
            trend="Needs Review"
            trendColor="#92400e"
            trendBg="#fef3c7"
          />
          <StatCard 
            label="Terminated" 
            value={terminated} 
            accentColor="#ef4444" // Red
            trend="High Risk"
            trendColor="#991b1b"
            trendBg="#fee2e2"
          />
        </div>

        {/* ================= CONTROLS ROW ================= */}
        <div style={styles.controls}>
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

          <div style={styles.searchWrapper}>
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
                        Review Log
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

// UPDATED: Cleaner, tighter layout with left-border accent
const StatCard = ({ label, value, accentColor, trend, trendColor, trendBg }) => (
  <div style={{...styles.statCard, borderLeft: `4px solid ${accentColor}`}}>
    <div style={styles.statHeader}>
      <p style={styles.statLabel}>{label}</p>
      <span style={{
        ...styles.trendBadge, 
        color: trendColor, 
        background: trendBg
      }}>
        {trend}
      </span>
    </div>
    <h3 style={styles.statValue}>{value}</h3>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    COMPLETED: { bg: "#f0fdf4", color: "#166534" },
    ONGOING:   { bg: "#eff6ff", color: "#1e40af" },
    FLAGGED:   { bg: "#fffbeb", color: "#92400e" },
    TERMINATED:{ bg: "#fef2f2", color: "#991b1b" }
  };
  const style = config[status] || config.COMPLETED;

  return (
    <span style={{...styles.badge, background: style.bg, color: style.color}}>
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
    background: "#f8fafc", // Slightly cooler gray
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a"
  },
  
  /* HEADER */
  header: {
    background: "white",
    height: 64, // Slightly shorter header
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  
  profileWrapper: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  dropdownMenu: {
    position: 'absolute',
    top: '90%', 
    right: 0,
    background: 'white',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: 6,
    width: 140,
    zIndex: 200,
    animation: 'fadeIn 0.2s ease-out'
  },
  logoutBtn: {
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444', 
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },

  adminBadge: { fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  avatar: { width: 32, height: 32, background: "#334155", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  
  /* CONTAINER */
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 20px"
  },

  /* STATS GRID */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginBottom: 32
  },
  // UPDATED CARD STYLES
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 12, // Tighter spacing between label and value
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default"
  },
  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statLabel: { 
    fontSize: 13, 
    fontWeight: 600, 
    color: "#64748b", 
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  trendBadge: { 
    fontSize: 11, 
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99
  },
  statValue: { 
    fontSize: 30, 
    fontWeight: 700, 
    margin: 0,
    color: "#0f172a",
    lineHeight: 1
  },

  /* CONTROLS */
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16
  },
  tabs: {
    background: "#e2e8f0",
    padding: 3,
    borderRadius: 8,
    display: "flex",
    gap: 2
  },
  tabBtn: {
    padding: "6px 14px",
    borderRadius: 6,
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
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  searchWrapper: {
    position: "relative",
    width: 260
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px", 
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 13,
    transition: "border-color 0.2s, box-shadow 0.2s"
  },

  /* TABLE */
  tableCard: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "14px 24px",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc"
  },
  row: { borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" },
  td: { padding: "14px 24px", fontSize: 13, color: "#334155" },
  
  studentId: { fontFamily: "monospace", fontWeight: 600, color: "#0f172a" },
  badge: {
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center"
  },
  
  /* RISK SCORE COMPONENT */
  riskWrapper: { display: "flex", alignItems: "center", gap: 10 },
  riskTrack: { width: 50, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  riskFill: { height: "100%", borderRadius: 99 },
  riskText: { fontSize: 12, fontWeight: 600 },

  viewBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
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
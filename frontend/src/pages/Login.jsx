import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student"); // student | admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (
      role === "student" &&
      email === "student@example.com" &&
      password === "exam123"
    ) {
      navigate("/exam");
    } 
    else if (
      role === "admin" &&
      email === "admin@example.com" &&
      password === "admin123"
    ) {
      navigate("/admin");
    } 
    else {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ICON */}
        <div style={styles.icon}>↪</div>

        {/* ROLE SWITCH */}
        <div style={styles.roleSwitch}>
          <button
            onClick={() => setRole("student")}
            style={{
              ...styles.roleBtn,
              ...(role === "student" ? styles.activeRole : {})
            }}
          >
            Student
          </button>
          <button
            onClick={() => setRole("admin")}
            style={{
              ...styles.roleBtn,
              ...(role === "admin" ? styles.activeRole : {})
            }}
          >
            Admin
          </button>
        </div>

        {/* TITLE */}
        <h2 style={styles.title}>
          {role === "student" ? "Student Login" : "Admin Login"}
        </h2>

        <p style={styles.subtitle}>
          {role === "student"
            ? "Enter your credentials to start the exam"
            : "Enter admin credentials to access dashboard"}
        </p>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {/* ERROR */}
        {error && <p style={styles.error}>{error}</p>}

        {/* BUTTON */}
        <button style={styles.button} onClick={handleLogin}>
          {role === "student" ? "Start Exam" : "Go to Dashboard"}
        </button>

        {/* DEMO */}
        <p style={styles.demoText}>
          Demo login:{" "}
          {role === "student" ? (
            <>
              <b>student@example.com</b> / <b>exam123</b>
            </>
          ) : (
            <>
              <b>admin@example.com</b> / <b>admin123</b>
            </>
          )}
        </p>
      </div>
    </div>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: 20
  },

  card: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    padding: "32px 28px",
    borderRadius: 18,
    boxShadow: "0 25px 50px rgba(0,0,0,0.12)",
    textAlign: "center",
    boxSizing: "border-box" // ✅ SAFETY NET
  },
  

  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    fontSize: 20
  },

  roleSwitch: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 999,
    padding: 4,
    marginBottom: 20
  },

  roleBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "8px 0",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 14,
    color: "#475569"
  },

  activeRole: {
    background: "white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
    fontWeight: 600,
    color: "#0f172a"
  },

  title: {
    marginBottom: 6
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 22
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" // ✅ CRITICAL FIX
  },
  

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    background: "linear-gradient(180deg, #111827, #374151)",
    color: "white",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    marginTop: 6
  },

  error: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 8
  },

  demoText: {
    marginTop: 16,
    fontSize: 12,
    color: "#475569"
  }
};

export default Login;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function AttemptDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/admin/attempt/${id}/details`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
  }, [id]);

  if (!data) return <p style={{ padding: 20 }}>Loading...</p>;

  let runningScore = 0;

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>

      <h1>Attempt Details</h1>

      {/* SUMMARY */}
      <div style={styles.card}>
        <p><b>Student:</b> {data.attempt.user_id}</p>
        <p><b>Exam:</b> {data.attempt.exam_id}</p>
        <p><b>Status:</b> {data.attempt.status}</p>
        <p><b>Total Score:</b> {data.attempt.cheating_score}</p>
      </div>

      {/* TIMELINE */}
      <h2>Cheating Timeline</h2>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Weight</th>
              <th>Score After</th>
            </tr>
          </thead>
          <tbody>
            {data.events.map((e, i) => {
              runningScore += e.weight;
              return (
                <tr key={i}>
                  <td>{new Date(e.time).toLocaleString()}</td>
                  <td>{e.event_type}</td>
                  <td>{e.weight}</td>
                  <td>{runningScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 30,
    background: "#f1f5f9",
    minHeight: "100vh"
  },
  backBtn: {
    marginBottom: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },
  tableCard: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  }
};

export default AttemptDetails;

function Question({ question, selected, setSelected }) {
  return (
    <div style={styles.card}>
      <h4>{question.question}</h4>

      {question.options.map((opt, i) => (
        <div
          key={i}
          style={{
            ...styles.optionRow,
            borderColor: selected === i ? "#2563eb" : "#e5e7eb",
            background: selected === i ? "#eff6ff" : "#fff"
          }}
          onClick={() => setSelected(i)}
        >
          {/* LEFT: Option Text */}
          <span style={styles.optionText}>{opt}</span>

          {/* RIGHT: Radio Button */}
          <input
            type="radio"
            checked={selected === i}
            onChange={() => setSelected(i)}
          />
        </div>
      ))}
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  optionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    cursor: "pointer"
  },
  optionText: {
    fontSize: 15
  }
};

export default Question;

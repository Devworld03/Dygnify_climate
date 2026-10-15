
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;
const MAX_YEAR = CURRENT_YEAR - 1;
const MAX_SPAN = 80;

export default function RangePicker({
  range,
  onChange,
  onAnalyze,
  disabled = false,
}) {
  const update = (field, value) => {
    onChange({
      ...range,
      [field]: value === "" ? "" : Number(value),
    });
  };

  const startValid =
    Number.isInteger(range.startYear) &&
    range.startYear >= MIN_YEAR &&
    range.startYear <= MAX_YEAR;

  const endValid =
    Number.isInteger(range.endYear) &&
    range.endYear >= MIN_YEAR &&
    range.endYear <= MAX_YEAR;

  const valid =
    startValid &&
    endValid &&
    range.endYear >= range.startYear &&
    range.endYear - range.startYear + 1 <= MAX_SPAN;

  return (
    <section style={styles.card}>
      <h2 style={styles.heading}>📅 Analysis Period</h2>
      <p style={styles.muted}>
        Choose the historical years to analyze.
      </p>

      <div style={styles.grid}>
        <div>
          <label style={styles.label} htmlFor="start-year">
            Start year
          </label>
          <input
            id="start-year"
            type="number"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step="1"
            value={range.startYear}
            disabled={disabled}
            onChange={(e) => update("startYear", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label} htmlFor="end-year">
            End year
          </label>
          <input
            id="end-year"
            type="number"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step="1"
            value={range.endYear}
            disabled={disabled}
            onChange={(e) => update("endYear", e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {!valid && (
        <p style={styles.error}>
          Enter valid years from {MIN_YEAR} to {MAX_YEAR}. The end year
          must not precede the start year, and the range cannot exceed{" "}
          {MAX_SPAN} years.
        </p>
      )}

      <p style={styles.muted}>
        Hazard: <strong>Heatwave</strong> · At least 3 consecutive hot days
      </p>

      <button
        type="button"
        disabled={!valid || disabled}
        onClick={onAnalyze}
        style={{
          ...styles.button,
          opacity: !valid || disabled ? 0.5 : 1,
          cursor: !valid || disabled ? "not-allowed" : "pointer",
        }}
      >
        {disabled ? "Analyzing..." : "Analyze Climate Trends"}
      </button>
    </section>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
  },
  heading: { fontSize: 19, margin: "0 0 8px" },
  muted: { fontSize: 13, color: "#6b7280", lineHeight: 1.5 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  input: {
    width: "100%",
    padding: 11,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    boxSizing: "border-box",
    fontSize: 14,
  },
  error: { color: "#b91c1c", fontSize: 13, lineHeight: 1.5 },
  button: {
    width: "100%",
    marginTop: 14,
    padding: 12,
    border: 0,
    borderRadius: 8,
    background: "#166534",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },
};
